"use client";
import { createContext, useContext, useLayoutEffect } from "react";
import type { ControllerAction } from "@/lib/controller-input";
export type InputHandler = (action: ControllerAction) => boolean;
export const ConsoleInput = createContext<{
  register: (handler: InputHandler) => () => void;
}>({ register: () => () => {} });
export function useExperienceInput(handler: InputHandler) {
  const { register } = useContext(ConsoleInput);
  useLayoutEffect(() => register(handler), [handler, register]);
}
