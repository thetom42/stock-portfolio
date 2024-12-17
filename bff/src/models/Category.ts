// Base interface matching DB model
export interface Category {
    id: string;
    name: string;
}

// DTO for API requests
export interface CreateCategoryDTO {
    name: string;
}

// DTO for API responses
export interface CategoryResponse extends Category {
    // Extended with any additional fields needed for the frontend
    // Currently matches base interface, but can be extended as needed
}

// DTO for updating categories
export interface UpdateCategoryDTO {
    name?: string;
}
