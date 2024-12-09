export interface Holding {
    holdings_id: string;
    portfolios_id: string;
    isin: string;
    quantity: number;
    start_date: Date;
    end_date: Date | null;
}
