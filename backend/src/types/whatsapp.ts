// Request/Response types for WhatsApp API

export interface PairingCodeRequest {
  phoneNumber: string;
  isUpdate?: boolean;
  oldNumber?: string;
}

export interface PairingCodeResponse {
  pairingCode: string;
}

export interface WhatsAppMessage {
  key: {
    remoteJid?: string;
    id?: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text?: string;
    };
    protocolMessage?: {
      editedMessage?: {
        conversation?: string;
      };
    };
  };
  pushName?: string;
}

export interface WhatsAppSession {
  phoneNumber: string;
  filePath?: string;
  filePathId?: string;
}
