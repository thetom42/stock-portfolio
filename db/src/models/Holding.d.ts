export interface Holding {
    holding_id: string;
    portfolio_id: string;
    isin: string;
    quantity: number;
    start_date: Date;
    end_date: Date | null;
}
