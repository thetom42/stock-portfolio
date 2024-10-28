export interface Holding {
    HOLDINGS_ID: string;
    PORTFOLIOS_ID: string;
    ISIN: string;
    QUANTITY: number;
    START_DATE: Date;
    END_DATE: Date | null;
}
