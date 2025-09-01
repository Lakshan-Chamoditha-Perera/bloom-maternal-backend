// utils/bp.util.ts
export function parseBpToString(systolic?: number, diastolic?: number) {
    if (typeof systolic === "number" && typeof diastolic === "number") {
        return `${systolic}/${diastolic}`;
    }
    return undefined;
}

export function parseBpString(bp: string): { systolic: number; diastolic: number } | null {
    const m = bp?.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
    if (!m) return null;
    const systolic = Number(m[1]);
    const diastolic = Number(m[2]);
    if (Number.isNaN(systolic) || Number.isNaN(diastolic)) return null;
    return { systolic, diastolic };
}
