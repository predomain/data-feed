import express from "express";

export interface RequestPacketModel {
  isLocked: boolean;
  isResolved: boolean;
  hasElapsedProcessingLimit: boolean;
  request?: express.Request;
  response?: express.Response;
  routeId?: number;
  messageId?: string;
}
