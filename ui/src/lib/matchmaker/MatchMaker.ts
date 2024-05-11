import { io, Socket } from 'socket.io-client';
export class PlayerConsent {
	publicKey: string;
	proxyKey: string;
	jsonSignature: string;
	constructor(publicKey: string, proxyKey: string, jsonSignature: string) {
		this.publicKey = publicKey;
		this.proxyKey = proxyKey;
		this.jsonSignature = jsonSignature;
	}
	static fromJSON(json: string): PlayerConsent {
		return new PlayerConsent(...(JSON.parse(json) as [string, string, string]));
	}
	static toJSON(pc: PlayerConsent): string {
		return JSON.stringify(pc);
	}
	static empty(): PlayerConsent {
		return new PlayerConsent('', '', '');
	}
}
type ServerStartGame = {
	roomId: string;
	playAsBlack: boolean;
	opponent: {
		publicKey: string;
		proxyKey: string;
		jsonSign: string;
	};
};
export type MatchInfo = {
	self: PlayerConsent;
	opponent: PlayerConsent;
	socket: Socket;
	playAsBlack: boolean;
};

export default class MatchMaker {
	roomId: string;
	opponent: PlayerConsent;
	private socket: Socket;

	async setup(server: string) {
		console.info('setting up socket.io');
		this.socket = io(server);
	}
	async abort() {
		console.info('aborting...');
		this.socket.disconnect();
	}
	async findMatch(consent: PlayerConsent) {
		console.info('finding a match...');
		return await new Promise<MatchInfo>((res) => {
			this.socket.on('startGame', ({ roomId, playAsBlack, opponent }: ServerStartGame) => {
				this.roomId = roomId;
				this.opponent = new PlayerConsent(opponent.publicKey, opponent.proxyKey, opponent.jsonSign);
				res({ self: consent, opponent: this.opponent, socket: this.socket, playAsBlack });
			});
			this.socket.emit('find', consent.publicKey, consent.proxyKey, consent.jsonSignature);
		});
	}
}
