import { Decimal } from '@prisma/client/runtime/library';

export interface Quote {
    quote_id: string;
    isin: string;
    price: Decimal;
    currency: string;
    market_time: Date;
    exchange: string;
}

// Helper type for creating quotes without having to specify Decimal type
export type CreateQuoteInput = Omit<Quote, 'price'> & {
    price: number | Decimal;
}
