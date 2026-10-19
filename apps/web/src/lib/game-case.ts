/** One physical Blu-ray case specification shared by games and all five domains. */
export const GAME_CASE = { width: .46, height: .615, depth: .066, baseY: 1.45, centerZ: .13 } as const;
export const CASE_CENTER_Y = GAME_CASE.baseY + GAME_CASE.height / 2;
export const GAME_CASE_SHELL = { color: "#1b609d", roughness: .32, metalness: .09 } as const;
