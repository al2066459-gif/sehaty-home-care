import { queryOptions } from "@tanstack/react-query";
import { getAmbulanceCompanies } from "./ambulance.functions";
export const ambulanceQuery = queryOptions({ queryKey: ["ambulance-companies"], queryFn: () => getAmbulanceCompanies(), staleTime: 60_000 });
