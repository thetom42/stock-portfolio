import { Decimal } from '@prisma/client/runtime/library';

export interface Quote {
    QUOTES_ID: string;
    ISIN: string;
    PRICE: Decimal;
    CURRENCY: string;
    MARKET_TIME: Date;
    EXCHANGE: string;
}

// Helper type for creating quotes without having to specify Decimal type
export type CreateQuoteInput = Omit<Quote, 'PRICE'> & {
    PRICE: number | Decimal;
};
