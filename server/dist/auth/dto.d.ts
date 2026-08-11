export declare class SendEmailCodeDto {
    email: string;
}
export declare class VerifyEmailCodeDto {
    email: string;
    code: string;
}
export declare class OAuthUrlDto {
    provider: 'qq' | 'wechat';
    redirectTo?: string;
}
export declare class ExchangeLoginTicketDto {
    ticket: string;
}
