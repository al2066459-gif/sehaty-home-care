import { queryOptions } from "@tanstack/react-query";
import { getDirectory } from "./directory.functions";
export const directoryQuery = queryOptions({ queryKey: ["medical-directory"], queryFn: () => getDirectory(), staleTime: 60_000 });