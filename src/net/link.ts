import type { Intent } from '../input/intent';
import { ICE_SERVERS } from '../config/online';
import { packIntent, unpackIntent, type SignalMsg } from './room';
import type { Signal } from './signal';

export type HostState = 'opening' | 'waiting' | 'connecting' | 'connected' | 'lost' | 'error';
export type GuestState = 'joining' | 'connecting' | 'connected' | 'lost' | 'notFound' | 'full' | 'error';

/** 房主等多久沒人說「這個號碼有人用了」就當作號碼可以用。 */
const PROBE_MS = 700;
/** 朋友每隔多久敲一次門,敲多久沒回應就說找不到房間。 */
const HELLO_EVERY_MS = 1200;
const HELLO_GIVE_UP_MS = 12000;
/** 朋友的操作沒變化時,也每隔這麼久送一次(萬一有一包掉了)。 */
const RESEND_MS = 100;
/** 傳畫面的位元率上限:960×540 的卡通畫面夠清楚,也不會吃掉太多流量。 */
const MAX_VIDEO_BPS = 2_500_000;

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * 房主:遊戲在這台跑。朋友敲門就建立直接連線,把遊戲畫面和聲音傳過去,收朋友的操作給玩家 B。
 * 朋友斷線後重新敲門,會重新連上。
 */
export class HostLink {
  readonly id = randomId();
  state: HostState = 'opening';
  onState: (s: HostState) => void = () => undefined;
  private pc: RTCPeerConnection | null = null;
  private peer: string | null = null;
  private bits = 0;
  private closed = false;

  constructor(
    private readonly signal: Signal,
    /** 要傳給朋友的畫面與聲音。 */
    private readonly media: () => MediaStream | null,
  ) {
    signal.onMessage((m) => void this.handle(m));
  }

  /** 先問問這個號碼有沒有人在用;有人用就回傳 false(換一個號碼再開)。 */
  async open(): Promise<boolean> {
    let taken = false;
    this.signal.onMessage((m) => {
      if (m.t === 'taken' && m.to === this.id) taken = true;
    });
    try {
      await this.signal.ready;
    } catch {
      this.set('error');
      return false;
    }
    this.signal.send({ t: 'probe', from: this.id });
    await new Promise((r) => setTimeout(r, PROBE_MS));
    if (taken || this.closed) return false;
    this.set('waiting');
    return true;
  }

  /** 玩家 B 的操作;還沒連上或斷線時是 null。 */
  intent(): Intent | null {
    return this.state === 'connected' ? unpackIntent(this.bits) : null;
  }

  close(): void {
    this.closed = true;
    this.pc?.close();
    this.pc = null;
    this.signal.close();
  }

  private set(s: HostState): void {
    if (this.state === s) return;
    this.state = s;
    if (s !== 'connected') this.bits = 0;
    this.onState(s);
  }

  private async handle(m: SignalMsg): Promise<void> {
    if (this.closed || this.state === 'opening' || this.state === 'error') return;
    // 別的房主想用同一個號碼:告訴他有人用了。
    if (m.t === 'probe') this.signal.send({ t: 'taken', to: m.from });
    else if (m.t === 'hello') await this.onHello(m.from);
    else if (m.t === 'answer' && m.to === this.id && m.from === this.peer) await this.pc?.setRemoteDescription({ type: 'answer', sdp: m.sdp }).catch(() => this.set('lost'));
    else if (m.t === 'ice' && m.to === this.id && m.from === this.peer) await this.pc?.addIceCandidate(m.c ?? undefined).catch(() => undefined);
  }

  private async onHello(from: string): Promise<void> {
    if (from === this.peer && (this.state === 'connecting' || this.state === 'connected')) return;
    // 已經有朋友在玩了:只有兩個人,第三個人進不來。
    if (this.state === 'connected' && from !== this.peer) {
      this.signal.send({ t: 'full', to: from });
      return;
    }
    this.pc?.close();
    this.peer = from;
    this.set('connecting');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;
    const stream = this.media();
    stream?.getTracks().forEach((t) => {
      const sender = pc.addTrack(t, stream);
      if (t.kind === 'video') this.capBitrate(sender);
    });
    // 操作要快、不用重送:掉一包沒關係,下一包馬上就來。
    const dc = pc.createDataChannel('input', { ordered: false, maxRetransmits: 0 });
    dc.onmessage = (e) => {
      if (pc === this.pc) this.bits = Number(e.data) & 63;
    };
    pc.onicecandidate = (e) => this.signal.send({ t: 'ice', from: this.id, to: from, c: e.candidate ? e.candidate.toJSON() : null });
    pc.onconnectionstatechange = () => {
      if (pc !== this.pc) return;
      if (pc.connectionState === 'connected') this.set('connected');
      else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') this.set('lost');
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.signal.send({ t: 'offer', from: this.id, to: from, sdp: offer.sdp ?? '' });
  }

  private capBitrate(sender: RTCRtpSender): void {
    const params = sender.getParameters();
    params.encodings = params.encodings?.length ? params.encodings : [{}];
    params.encodings[0].maxBitrate = MAX_VIDEO_BPS;
    void sender.setParameters(params).catch(() => undefined);
  }
}

/** 朋友:不跑遊戲,只看房主傳來的畫面、把自己的操作傳過去。 */
export class GuestLink {
  readonly id = randomId();
  state: GuestState = 'joining';
  onState: (s: GuestState) => void = () => undefined;
  onStream: (s: MediaStream) => void = () => undefined;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private host: string | null = null;
  private helloTimer: ReturnType<typeof setInterval> | null = null;
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  private bits = 0;
  private closed = false;

  constructor(private readonly signal: Signal) {
    signal.onMessage((m) => void this.handle(m));
  }

  async join(): Promise<void> {
    try {
      await this.signal.ready;
    } catch {
      this.set('error');
      return;
    }
    this.knock();
    this.resendTimer = setInterval(() => this.flush(), RESEND_MS);
  }

  /** 把目前的操作送給房主(有變化才馬上送,沒變化就交給定時重送)。 */
  sendIntent(i: Intent): void {
    const bits = packIntent(i);
    if (bits === this.bits) return;
    this.bits = bits;
    this.flush();
  }

  /** 斷線後再敲一次門。 */
  retry(): void {
    if (this.closed) return;
    this.pc?.close();
    this.pc = null;
    this.dc = null;
    this.host = null;
    this.knock();
  }

  close(): void {
    this.closed = true;
    this.stopKnocking();
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.pc?.close();
    this.signal.close();
  }

  private knock(): void {
    this.set('joining');
    this.stopKnocking();
    const started = Date.now();
    const hello = (): void => {
      if (this.host) return this.stopKnocking();
      if (Date.now() - started > HELLO_GIVE_UP_MS) {
        this.stopKnocking();
        this.set('notFound');
        return;
      }
      this.signal.send({ t: 'hello', from: this.id });
    };
    hello();
    this.helloTimer = setInterval(hello, HELLO_EVERY_MS);
  }

  private stopKnocking(): void {
    if (this.helloTimer) clearInterval(this.helloTimer);
    this.helloTimer = null;
  }

  private flush(): void {
    if (this.dc?.readyState === 'open') this.dc.send(String(this.bits));
  }

  private set(s: GuestState): void {
    if (this.state === s) return;
    this.state = s;
    this.onState(s);
  }

  private async handle(m: SignalMsg): Promise<void> {
    if (this.closed) return;
    if (m.t === 'full' && m.to === this.id) {
      this.stopKnocking();
      this.set('full');
    } else if (m.t === 'offer' && m.to === this.id && !this.host) {
      this.host = m.from;
      this.stopKnocking();
      await this.answer(m.from, m.sdp);
    } else if (m.t === 'ice' && m.to === this.id && m.from === this.host) {
      await this.pc?.addIceCandidate(m.c ?? undefined).catch(() => undefined);
    }
  }

  private async answer(host: string, sdp: string): Promise<void> {
    this.set('connecting');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;
    pc.ontrack = (e) => this.onStream(e.streams[0] ?? new MediaStream([e.track]));
    pc.ondatachannel = (e) => {
      this.dc = e.channel;
      this.dc.onopen = () => this.flush();
    };
    pc.onicecandidate = (e) => this.signal.send({ t: 'ice', from: this.id, to: host, c: e.candidate ? e.candidate.toJSON() : null });
    pc.onconnectionstatechange = () => {
      if (pc !== this.pc) return;
      if (pc.connectionState === 'connected') this.set('connected');
      else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') this.set('lost');
    };
    await pc.setRemoteDescription({ type: 'offer', sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.signal.send({ t: 'answer', from: this.id, to: host, sdp: answer.sdp ?? '' });
  }
}

