export declare class EmailOtpProvider {
    private readonly logger;
    sendCode(email: string, code: string): Promise<void>;
}
