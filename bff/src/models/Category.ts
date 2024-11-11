// Base interface matching DB model
export interface Category {
    CATEGORIES_ID: string;
    NAME: string;
}

// DTO for API requests
export interface CreateCategoryDTO {
    NAME: string;
}

// DTO for API responses
export interface CategoryResponse extends Category {
    // Extended with any additional fields needed for the frontend
    // Currently matches base interface, but can be extended as needed
}

// DTO for updating categories
export interface UpdateCategoryDTO {
    NAME?: string;
}
