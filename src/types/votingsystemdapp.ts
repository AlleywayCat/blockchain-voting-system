import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { IDL } from "../generated/votingsystemdapp-idl";

// Use type assertions to work around the type issues
export type PollOption = IdlTypes<any>["PollOption"];
export type Poll = IdlAccounts<any>["Poll"];
export type VoterRegistry = IdlAccounts<any>["VoterRegistry"];
export type VoteRecord = IdlAccounts<any>["VoteRecord"]; 