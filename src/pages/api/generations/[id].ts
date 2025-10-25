import type { APIRoute } from "astro";
import { z } from "zod";
import { updateGenerationSchema } from "@/lib/validation/generations.schema";
import { GenerationService } from "@/lib/services/generation.service.ts";
import type { GenerationLogDTO } from "@/types";

export const prerender = false;

const idSchema = z.string().uuid();

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  const session = await locals.auth.getSession();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  const idValidation = idSchema.safeParse(id);

  if (!idValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Invalid generation ID format.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const generationId = idValidation.data;

  try {
    const body = await request.json();
    const validation = updateGenerationSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid request body.",
          details: validation.error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command = validation.data;
    const generationService = new GenerationService(locals.supabase);

    const updatedGeneration = await generationService.updateGenerationStats(session.user.id, generationId, command);

    const responseDto: GenerationLogDTO = {
      id: updatedGeneration.id,
      model: updatedGeneration.model,
      source_text_hash: updatedGeneration.source_text_hash,
      source_text_length: updatedGeneration.source_text_length,
      generated_count: updatedGeneration.generated_count,
      accepted_unedited_count: updatedGeneration.accepted_unedited_count,
      accepted_edited_count: updatedGeneration.accepted_edited_count,
      rejected_count: updatedGeneration.rejected_count,
      generation_duration: updatedGeneration.generation_duration,
      created_at: updatedGeneration.created_at,
      updated_at: updatedGeneration.updated_at,
    };

    return new Response(JSON.stringify(responseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Generation not found")) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Generation log not found.",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      if (error.name === "ValidationError") {
        return new Response(JSON.stringify({ error: "Bad Request", message: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    console.error("Error updating generation stats:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
