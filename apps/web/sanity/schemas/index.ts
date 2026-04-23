import type { SchemaTypeDefinition } from "sanity";
import { van } from "./van";
import { article } from "./article";
import { testimonial } from "./testimonial";

export const schemaTypes: SchemaTypeDefinition[] = [van, article, testimonial];
