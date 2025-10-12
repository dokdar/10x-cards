# REST API Plan

This document outlines the design for the REST API for the 10xCards application, based on the provided database schema and product requirements. The API is designed to be consumed by a frontend application (Astro/React). All endpoints are prefixed with `/api/v1`.

## 1. Resources

-   **Flashcards**: Represents the user-created flashcards. Corresponds to the `app.flashcards` table.
-   **Generations**: Represents the AI flashcard generation process. It's a functional resource that encapsulates the logic of calling an external AI service and returning candidate flashcards. It corresponds to the `app.generations` and `app.generation_error_logs` tables for logging purposes.

---

## 2. Endpoints

### 2.1. Flashcards

#### **List Flashcards**

-   **Method**: `GET`
-   **URL**: `/flashcards`
-   **Description**: Retrieves a paginated list of flashcards for the authenticated user. Supports text-based search across `front` and `back` fields.
-   **Query Parameters**:
    -   `page` (optional, integer, default: `1`): The page number for pagination.
    -   `limit` (optional, integer, default: `20`): The number of items per page.
    -   `search` (optional, string): A search term to filter flashcards.
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Payload**:
        ```json
        {
          "data": [
            {
              "id": "1e7c9f8a-3e34-4b48-a2a4-1b3b2a5b2a4d",
              "front": "What is REST?",
              "back": "Representational State Transfer is an architectural style for designing networked applications.",
              "source": "manual",
              "generation_id": null,
              "created_at": "2024-10-12T10:00:00Z",
              "updated_at": "2024-10-12T10:00:00Z"
            }
          ],
          "pagination": {
            "total_items": 1,
            "total_pages": 1,
            "current_page": 1,
            "limit": 20
          }
        }
        ```
-   **Error Responses**:
    -   `401 Unauthorized`: If the user is not authenticated.

---

#### **Create Flashcard(s)**

-   **Method**: `POST`
-   **URL**: `/flashcards`
-   **Description**: Creates one or more new flashcards for the authenticated user. The endpoint accepts either a single flashcard object or an array of flashcard objects for bulk insertion.
-   **Request Body**:
    -   **Single**:
        ```json
        {
          "front": "What is Astro?",
          "back": "A web framework for building fast, content-driven websites.",
          "source": "manual",
          "generation_id": null
        }
        ```
    -   **Bulk**:
        ```json
        [
          {
            "front": "What is Astro?",
            "back": "A web framework...",
            "source": "ai-edited",
            "generation_id": "c3e4b7a1-8e1d-4f2a-8b8a-1e3d4a5b6c7d"
          },
          {
            "front": "What is React?",
            "back": "A JavaScript library for building user interfaces.",
            "source": "ai-full",
            "generation_id": "c3e4b7a1-8e1d-4f2a-8b8a-1e3d4a5b6c7d"
          }
        ]
        ```
-   **Success Response**:
    -   **Code**: `201 Created`
    -   **Payload**: An array of the newly created flashcard(s).
        ```json
        [
          {
            "id": "2b8d9e7c-4a3b-4c2d-8e7f-6a5b4c3d2e1f",
            "front": "What is Astro?",
            "back": "A web framework for building fast, content-driven websites.",
            "source": "manual",
            "generation_id": null,
            "created_at": "2024-10-12T11:00:00Z",
            "updated_at": "2024-10-12T11:00:00Z"
          }
        ]
        ```
-   **Error Responses**:
    -   `400 Bad Request`: If validation fails (e.g., missing fields, length constraints violated).
    -   `401 Unauthorized`: If the user is not authenticated.

---

#### **Get Flashcard**

-   **Method**: `GET`
-   **URL**: `/flashcards/{id}`
-   **Description**: Retrieves a single flashcard by its ID.
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Payload**:
        ```json
        {
          "id": "1e7c9f8a-3e34-4b48-a2a4-1b3b2a5b2a4d",
          "front": "What is REST?",
          "back": "Representational State Transfer is an architectural style for designing networked applications.",
          "source": "manual",
          "generation_id": null,
          "created_at": "2024-10-12T10:00:00Z",
          "updated_at": "2024-10-12T10:00:00Z"
        }
        ```
-   **Error Responses**:
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `403 Forbidden`: If the user tries to access a flashcard they do not own.
    -   `404 Not Found`: If the flashcard with the specified ID does not exist.

---

#### **Update Flashcard**

-   **Method**: `PATCH`
-   **URL**: `/flashcards/{id}`
-   **Description**: Updates a flashcard's content.
-   **Request Body**:
    ```json
    {
      "front": "What is REST API?",
      "back": "An API that conforms to the constraints of REST architectural style."
    }
    ```
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Payload**: The updated flashcard object.
-   **Error Responses**:
    -   `400 Bad Request`: If validation fails (e.g., `front` or `back` exceed length limits).
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `403 Forbidden`: If the user tries to update a flashcard they do not own.
    -   `404 Not Found`: If the flashcard does not exist.

---

#### **Delete Flashcard**

-   **Method**: `DELETE`
-   **URL**: `/flashcards/{id}`
-   **Description**: Deletes a flashcard by its ID.
-   **Success Response**:
    -   **Code**: `204 No Content`
-   **Error Responses**:
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `403 Forbidden`: If the user tries to delete a flashcard they do not own.
    -   `404 Not Found`: If the flashcard does not exist.

---

### 2.2. Generations

#### **Generate Flashcard Candidates**

-   **Method**: `POST`
-   **URL**: `/generations`
-   **Description**: Initiates the AI generation process. The API receives source text, communicates with an external AI service (e.g., OpenRouter), and returns a list of flashcard candidates for the user to review. This endpoint will also log metadata about the generation attempt to the `app.generations` or `app.generation_error_logs` table.
-   **Request Body**:
    ```json
    {
      "source_text": "A long text between 1,000 and 10,000 characters...",
      "model": "openai/gpt-4o"
    }
    ```
    **Note**: The `model` field is optional. If not provided, defaults to `openai/gpt-4o`.
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Payload**:
        ```json
        {
          "generation_id": "c3e4b7a1-8e1d-4f2a-8b8a-1e3d4a5b6c7d",
          "model": "openai/gpt-4o",
          "source_text_hash": "sha256:a1b2c3d4e5f6...",
          "source_text_length": 5847,
          "generated_count": 2,
          "rejected_count": 0,
          "generation_duration": 15234,
          "created_at": "2024-10-12T14:30:00.000Z",
          "candidates": [
            {
              "front": "AI Candidate 1 Front",
              "back": "AI Candidate 1 Back",
              "source": "ai-full"
            },
            {
              "front": "AI Candidate 2 Front",
              "back": "AI Candidate 2 Back",
              "source": "ai-full"
            }
          ]
        }
        ```
-   **Error Responses**:
    -   `400 Bad Request`: If `source_text` validation fails (e.g., length is outside the 1,000-10,000 character range).
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `500 Internal Server Error`: For generic server-side errors.
    -   `502 Bad Gateway`: If the external AI service is unavailable or returns an error. The response body should contain a user-friendly error message.

---

#### **Update Generation Log**

-   **Method**: `PATCH`
-   **URL**: `/generations/{id}`
-   **Description**: Updates a generation log with the results of the user's review session (number of accepted, edited, and rejected flashcards). This should be called by the client after the review process is complete to fulfill metric collection requirements.
-   **Request Body**:
    ```json
    {
      "accepted_unedited_count": 10,
      "accepted_edited_count": 5,
      "rejected_count": 3
    }
    ```
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Payload**: The updated generation log object.
        ```json
        {
          "generation_id": "c3e4b7a1-8e1d-4f2a-8b8a-1e3d4a5b6c7d",
          "model": "openai/gpt-4o",
          "source_text_hash": "a1b2c3d4e5f6...",
          "source_text_length": 5432,
          "generated_count": 18,
          "accepted_unedited_count": 10,
          "accepted_edited_count": 5,
          "rejected_count": 3,
          "generation_duration": 15234,
          "created_at": "2024-10-12T12:00:00Z",
          "updated_at": "2024-10-12T12:05:00Z"
        }
        ```
-   **Error Responses**:
    -   `400 Bad Request`: If validation fails (e.g., counts are not valid non-negative integers, or their sum does not match the total number of generated candidates).
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `403 Forbidden`: If the user tries to update a generation log they do not own.
    -   `404 Not Found`: If the generation log does not exist.

---

## 3. Authentication and Authorization

-   **Mechanism**: Authentication will be handled using JSON Web Tokens (JWT) provided by Supabase Auth.
-   **Implementation**:
    1.  The client application will use the Supabase client-side SDK for user registration and login.
    2.  Upon successful login, Supabase provides a JWT.
    3.  The client must include this JWT in the `Authorization` header for every request to the API: `Authorization: Bearer <SUPABASE_JWT>`.
    4.  The API backend will use a Supabase Admin client, initialized with the user's JWT from the request, to interact with the database. This ensures that all database operations are performed on behalf of the authenticated user and that the Row-Level Security (RLS) policies defined in the database are automatically enforced.

---

## 4. Validation and Business Logic

### Validation

Validation will be performed at the API layer before any database operations. A `400 Bad Request` response will be returned with a descriptive error message if validation fails.

-   **Flashcards**:
    -   `front`: Required, string, max 200 characters.
    -   `back`: Required, string, max 500 characters.
    -   `source`: Required, must be one of `ai-full`, `ai-edited`, or `manual`.
    -   `generation_id`: Optional, string, max 255 characters. Only required if `source` is `ai-full` or `ai-edited`.
-   **Generations**:
    -   `source_text`: Required, string, min 1,000 and max 10,000 characters.
    -   `model`: Optional, string. If not provided, defaults to `openai/gpt-4o`.

### Business Logic

-   **Data Isolation**: Enforced by Supabase's RLS policies, as described in the Authentication section. The API design relies on this mechanism for security.
-   **AI Generation**: The `POST /generations` endpoint encapsulates the entire business logic for this feature. It is responsible for:
    1.  Validating the input `source_text`.
    2.  Creating a hash of the text for logging.
    3.  Calling the external AI service via OpenRouter.
    4.  Parsing the AI's response to create flashcard candidates.
    5.  On success, logging the metadata to the `app.generations` table.
    6.  On failure, logging the error details to the `app.generation_error_logs` table.
    7.  Returning the candidates or a relevant error to the client.
-   **Generation Review**: The `PATCH /generations/{id}` endpoint handles the business logic for finalizing a review session. It validates that:
    1.  `accepted_unedited_count`, `accepted_edited_count`, and `rejected_count` are all non-negative integers.
    2.  The sum of these three counts equals the `generated_count` stored for that specific generation, ensuring data integrity.
-   **Bulk Operations**: The `POST /flashcards` endpoint's ability to accept an array of objects implements the bulk insert requirement (FR-004), allowing the client to save multiple reviewed flashcards in a single network request.
