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
/** 朋友的操作沒變化時,也每隔這麼久送一次(萬一有一包掉了;房主也靠它知道朋友還在)。 */
const RESEND_MS = 100;
/** 房主這麼久沒收到朋友的操作,就當作朋友不在了(玩家 B 停住、新的朋友可以進來)。 */
const STALE_MS = 1500;
/** 連線「暫時中斷」常常會自己恢復:這麼久還沒恢復才算斷線。 */
const BLIP_MS = 4000;
/** 傳畫面的位元率上限:960×540 的卡通畫面夠清楚,也不會吃掉太多流量。 */
const MAX_VIDEO_BPS = 2_500_000;

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * 一條直接連線:收到對方的連線資訊(ICE)時,如果還沒設定好對方的描述就先排隊。
 * 連線狀態「暫時中斷」等一下再判斷,「失敗」馬上算斷線。
 */
class Peer {
  readonly pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  private pending: (RTCIceCandidateInit | null)[] = [];
  private blip: ReturnType<typeof setTimeout> | null = null;

  constructor(onUp: () => void, onDown: () => void) {
    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState;
      if (s === 'connected') {
        this.clearBlip();
        onUp();
      } else if (s === 'disconnected') {
        this.clearBlip();
        this.blip = setTimeout(() => {
          if (this.pc.connectionState !== 'connected') onDown();
        }, BLIP_MS);
      } else if (s === 'failed' || s === 'closed') {
        this.clearBlip();
        onDown();
      }
    };
  }

  async setRemote(desc: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(desc);
    const queued = this.pending;
    this.pending = [];
    for (const c of queued) await this.pc.addIceCandidate(c ?? undefined).catch(() => undefined);
  }

  async addIce(c: RTCIceCandidateInit | null): Promise<void> {
    if (!this.pc.remoteDescription) this.pending.push(c);
    else await this.pc.addIceCandidate(c ?? undefined).catch(() => undefined);
  }

  /** 連線關掉時要順便收掉的東西。 */
  onClose: () => void = () => undefined;

  close(): void {
    this.clearBlip();
    this.pc.onconnectionstatechange = null;
    this.pc.close();
    this.onClose();
  }

  private clearBlip(): void {
    if (this.blip) clearTimeout(this.blip);
    this.blip = null;
  }
}

/**
 * 房主:遊戲在這台跑。朋友敲門就建立直接連線,把遊戲畫面和聲音傳過去,收朋友的操作給玩家 B。
 * 朋友斷線後重新敲門(就算重新整理換了身分),會重新連上。
 */
export class HostLink {
  readonly id = randomId();
  state: HostState = 'opening';
  onState: (s: HostState) => void = () => undefined;
  private peer: Peer | null = null;
  private peerId: string | null = null;
  private bits = 0;
  private lastInputAt = 0;
  private closed = false;

  constructor(
    private readonly signal: Signal,
    /** 要傳給朋友的畫面與聲音(每個房間同一份,換朋友時不重新錄)。 */
    private readonly media: MediaStream | null,
    private readonly now: () => number = () => performance.now(),
  ) {
    signal.onMessage((m) => void this.handle(m));
  }

  /** 先問問這個號碼有沒有人在用;有人用或連不上就回傳 false。 */
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
    if (this.closed) return false;
    this.signal.send({ t: 'probe', from: this.id });
    await new Promise((r) => setTimeout(r, PROBE_MS));
    if (taken || this.closed) return false;
    this.set('waiting');
    return true;
  }

  /** 朋友現在還在(連著而且最近有送操作來)。 */
  friendHere(): boolean {
    return this.state === 'connected' && this.now() - this.lastInputAt < STALE_MS;
  }

  /** 玩家 B 的操作;朋友不在時是 null(玩家 B 停住,不會一直按著同一個鍵)。 */
  intent(): Intent | null {
    return this.friendHere() ? unpackIntent(this.bits) : null;
  }

  close(): void {
    this.closed = true;
    this.peer?.close();
    this.peer = null;
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
    else if ((m.t !== 'answer' && m.t !== 'ice') || m.to !== this.id || m.from !== this.peerId || !this.peer) return;
    else if (m.t === 'answer') {
      const peer = this.peer;
      await peer.setRemote({ type: 'answer', sdp: m.sdp }).catch(() => {
        if (peer === this.peer) this.set('lost');
      });
    } else if (m.t === 'ice') await this.peer.addIce(m.c);
  }

  private async onHello(from: string): Promise<void> {
    // 同一個朋友在等回覆時會一直敲門:正在連就不用重來。
    if (from === this.peerId && this.state === 'connecting') return;
    // 已經有朋友在玩了:只有兩個人,第三個人進不來。朋友很久沒動靜(其實已經離開)就讓新的人進來。
    if (from !== this.peerId && this.friendHere()) {
      this.signal.send({ t: 'full', to: from });
      return;
    }
    this.peer?.close();
    this.peerId = from;
    this.set('connecting');
    const peer = new Peer(
      () => {
        if (peer !== this.peer) return;
        this.lastInputAt = this.now();
        this.set('connected');
      },
      () => {
        if (peer === this.peer) this.set('lost');
      },
    );
    this.peer = peer;
    const pc = peer.pc;
    // 每條連線用自己的一份軌道(複製品),連線關掉時一起停掉,不影響下一位朋友。
    const tracks = this.media?.getTracks().map((t) => t.clone()) ?? [];
    const stream = new MediaStream(tracks);
    peer.onClose = () => tracks.forEach((t) => t.stop());
    tracks.forEach((t) => {
      // 畫面:一開始就限制位元率(Safari 不接受連線後再改)。
      if (t.kind === 'video') pc.addTransceiver(t, { direction: 'sendonly', streams: [stream], sendEncodings: [{ maxBitrate: MAX_VIDEO_BPS }] });
      else pc.addTrack(t, stream);
    });
    // 操作要快、不用重送:掉一包沒關係,下一包馬上就來。
    const dc = pc.createDataChannel('input', { ordered: false, maxRetransmits: 0 });
    dc.onmessage = (e) => {
      if (peer !== this.peer) return;
      this.bits = Number(e.data) & 63;
      this.lastInputAt = this.now();
    };
    pc.onicecandidate = (e) => {
      if (peer === this.peer) this.signal.send({ t: 'ice', from: this.id, to: from, c: e.candidate ? e.candidate.toJSON() : null });
    };
    try {
      const offer = await pc.createOffer();
      if (peer !== this.peer || this.closed) return;
      await pc.setLocalDescription(offer);
      if (peer !== this.peer || this.closed) return;
      this.signal.send({ t: 'offer', from: this.id, to: from, sdp: offer.sdp ?? '' });
    } catch {
      if (peer === this.peer) this.set('lost');
    }
  }
}

/** 朋友:不跑遊戲,只看房主傳來的畫面、把自己的操作傳過去。 */
export class GuestLink {
  readonly id = randomId();
  state: GuestState = 'joining';
  onState: (s: GuestState) => void = () => undefined;
  onStream: (s: MediaStream) => void = () => undefined;
  private peer: Peer | null = null;
  private dc: RTCDataChannel | null = null;
  private hostId: string | null = null;
  private helloTimer: ReturnType<typeof setInterval> | null = null;
  private resendTimer: ReturnType<typeof setInterval> | null = null;
  private bits = 0;
  private closed = false;
  /** 敲門時房主說過「房間滿了」(可能只是房主還沒發現上一位已經離開,所以繼續敲)。 */
  private sawFull = false;

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
    if (this.closed) return;
    this.knock();
    this.resendTimer = setInterval(() => this.flush(), RESEND_MS);
  }

  /** 目前要送的操作(測試用)。 */
  get sentBits(): number {
    return this.bits;
  }

  /** 把目前的操作送給房主(有變化才馬上送,沒變化就交給定時重送)。 */
  sendIntent(i: Intent): void {
    const bits = packIntent(i);
    if (bits === this.bits) return;
    this.bits = bits;
    this.flush();
  }

  /** 斷線後再敲一次門(房主看到同一個朋友再敲門,會重新建立連線)。 */
  retry(): void {
    if (this.closed || this.state === 'connected' || this.state === 'joining') return;
    this.peer?.close();
    this.peer = null;
    this.dc = null;
    this.hostId = null;
    this.knock();
  }

  close(): void {
    this.closed = true;
    this.stopKnocking();
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.peer?.close();
    this.signal.close();
  }

  private knock(): void {
    this.set('joining');
    this.stopKnocking();
    this.sawFull = false;
    const started = Date.now();
    const hello = (): void => {
      if (this.hostId || this.closed) return this.stopKnocking();
      if (Date.now() - started > HELLO_GIVE_UP_MS) {
        this.stopKnocking();
        this.set(this.sawFull ? 'full' : 'notFound');
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
    if (m.t === 'full' && m.to === this.id && !this.hostId) {
      this.sawFull = true;
    } else if (m.t === 'offer' && m.to === this.id && !this.hostId) {
      this.hostId = m.from;
      this.stopKnocking();
      await this.answer(m.from, m.sdp);
    } else if (m.t === 'ice' && m.to === this.id && m.from === this.hostId) {
      await this.peer?.addIce(m.c);
    }
  }

  private async answer(host: string, sdp: string): Promise<void> {
    this.set('connecting');
    const peer = new Peer(
      () => {
        if (peer === this.peer) this.set('connected');
      },
      () => {
        if (peer === this.peer) this.set('lost');
      },
    );
    this.peer = peer;
    const pc = peer.pc;
    pc.ontrack = (e) => {
      if (peer === this.peer) this.onStream(e.streams[0] ?? new MediaStream([e.track]));
    };
    pc.ondatachannel = (e) => {
      if (peer !== this.peer) return;
      this.dc = e.channel;
      this.dc.onopen = () => this.flush();
    };
    pc.onicecandidate = (e) => {
      if (peer === this.peer) this.signal.send({ t: 'ice', from: this.id, to: host, c: e.candidate ? e.candidate.toJSON() : null });
    };
    try {
      await peer.setRemote({ type: 'offer', sdp });
      const answer = await pc.createAnswer();
      if (peer !== this.peer || this.closed) return;
      await pc.setLocalDescription(answer);
      if (peer !== this.peer || this.closed) return;
      this.signal.send({ t: 'answer', from: this.id, to: host, sdp: answer.sdp ?? '' });
    } catch {
      if (peer === this.peer) this.set('lost');
    }
  }
}
