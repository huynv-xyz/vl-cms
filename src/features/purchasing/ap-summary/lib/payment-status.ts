import type { Contract } from "@/features/purchasing/contract/data/schema"

/**
 * Yêu cầu chị KT: 4 trạng thái thanh toán NCC theo hợp đồng.
 *   NOT_PAID        : chưa có đồng nào (kể cả cọc)
 *   PARTIAL         : đã thanh toán < total_amount_vnd
 *   FULL            : đã thanh toán = total_amount_vnd (tol ±1 đơn vị do float)
 *   OVER            : đã thanh toán > total_amount_vnd (thanh toán vượt)
 */
export type PaymentStatus = "NOT_PAID" | "PARTIAL" | "FULL" | "OVER"

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
    NOT_PAID: "Chưa thanh toán",
    PARTIAL: "Đã thanh toán 1 phần",
    FULL: "Đã thanh toán đủ",
    OVER: "Thanh toán vượt",
}

export const PAYMENT_STATUS_TONE: Record<
    PaymentStatus,
    "default" | "secondary" | "destructive" | "outline"
> = {
    NOT_PAID: "outline",
    PARTIAL: "default",
    FULL: "secondary",
    OVER: "destructive",
}

export const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
    NOT_PAID: "border-slate-300 bg-slate-50 text-slate-700",
    PARTIAL: "border-amber-300 bg-amber-50 text-amber-800",
    FULL: "border-emerald-300 bg-emerald-50 text-emerald-800",
    OVER: "border-rose-300 bg-rose-50 text-rose-800",
}

export function getContractPaymentStatus(contract: Contract): PaymentStatus {
    const total = toNum(contract.total_amount_vnd)
    const paid = getPaidAmountVnd(contract)
    const eps = 1 // chấp nhận lệch ±1 VND do làm tròn

    if (paid <= eps) return "NOT_PAID"
    if (paid + eps < total) return "PARTIAL"
    if (paid > total + eps) return "OVER"
    return "FULL"
}

/**
 * Lấy số tiền đã thanh toán quy đổi VND để so sánh với total_amount_vnd.
 *
 * Yêu cầu chị KT: tiền TT & tổng tiền phải DÙNG CHUNG 1 LOẠI TIỀN TỆ → quy đổi
 * cả 2 bằng cùng 1 tỷ giá (rate hiệu dụng của hợp đồng).
 *
 * Thứ tự fallback:
 *   1. total_paid_amount_vnd từ BE — nếu lớn hơn raw thì BE đã quy đổi đúng
 *      (BE mới luôn dùng contractRate, sẽ > raw khi HĐ ngoại tệ)
 *   2. raw × effectiveRate — tính lại trên FE để khỏi phụ thuộc BE đã deploy hay chưa
 */
export function getPaidAmountVnd(contract: Contract): number {
    const raw = toNum(contract.total_paid_amount)
    if (raw === 0) return 0

    const rate = resolveEffectiveRate(contract)
    const computed = raw * rate

    // Nếu BE trả về total_paid_amount_vnd > computed (BE mới đã dùng đúng rate),
    // tin BE; ngược lại dùng computed (phòng trường hợp BE cũ chưa quy đổi).
    const fromBe = toNum(contract.total_paid_amount_vnd)
    if (fromBe > 0 && fromBe >= computed) return fromBe

    return computed
}

/** Tổng còn phải trả quy đổi VND. */
export function getRemainingAmountVnd(contract: Contract): number {
    const vnd = toNum(contract.remaining_amount_vnd)
    if (vnd > 0) return vnd

    const total = toNum(contract.total_amount_vnd)
    const paid = getPaidAmountVnd(contract)
    return Math.max(total - paid, 0)
}

/** Số tiền cọc dự kiến = total × deposit_rate (rate có thể là 0..1 hoặc 0..100). */
export function calcExpectedDeposit(contract: Contract) {
    const total = toNum(contract.total_amount_vnd)
    const rate = toNum(contract.deposit_rate)
    if (!total || !rate) return 0

    // deposit_rate có thể được lưu dưới dạng % (10, 30, 50) hoặc decimal (0.1, 0.3, 0.5).
    const normalized = rate > 1 ? rate / 100 : rate
    return Math.round(total * normalized)
}

/** Số tiền hàng cần thanh toán còn lại (VND) = total_vnd - paid_vnd (clamp ≥ 0). */
export function calcRemainingAmount(contract: Contract) {
    return getRemainingAmountVnd(contract)
}

function toNum(value: unknown): number {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
}

/**
 * Rate hiệu dụng để quy đổi raw payment → VND. Derive từ total_amount_vnd / total_amount
 * khi cả 2 đều > 0 (chắc chắn cùng tỷ giá BE đã dùng để tính total_amount_vnd).
 */
function resolveEffectiveRate(contract: Contract): number {
    // 1. exchange_rate khai báo trên HĐ
    const contractRate = toNum(contract.exchange_rate)
    if (contractRate > 0) return contractRate

    // 2. exchange_rate của currency master
    const currencyRate = toNum(contract.currency?.exchange_rate)
    if (currencyRate > 0) return currencyRate

    // 3. derive từ total_amount_vnd / total_amount
    const totalForeign = toNum(contract.total_amount)
    const totalVnd = toNum(contract.total_amount_vnd)
    if (totalForeign > 0 && totalVnd > 0 && totalVnd !== totalForeign) {
        return totalVnd / totalForeign
    }

    // 4. HĐ thuần VND hoặc thiếu data → giữ nguyên
    return 1
}
