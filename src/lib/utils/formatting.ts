import { intervalToDuration } from "date-fns";
import { formatDuration as formatDurationFn } from "date-fns";
import numeral from "numeral";

export const formatDuration = (seconds?: number) => {
    if (!seconds) return "0 seconds";

    const duration = intervalToDuration({
        start: 0,
        end: Number(seconds) * 1000, // Convert to milliseconds
    });

    return formatDurationFn(duration, {
        format: ["days", "hours", "minutes", "seconds"],
    });
};

export function displayNumber(
    value: string | number,
    maximumFractionDP = 8
): string {
    const valueNumber = Number(value);
    if (valueNumber === 0) return "0.00";

    const absNumber = Math.abs(valueNumber);

    let format: string | undefined;
    let maximumFractionDigits: number | undefined;
    if (!format) {
        if (absNumber >= 1.0e6) {
            format = "0,0.[0000]a";
        } else if (absNumber >= 1.0e3) {
            maximumFractionDigits = 2;
        } else if (absNumber >= 1) {
            maximumFractionDigits = 4;
        } else {
            const repeatCount = Math.abs(
                Math.floor(Math.log(absNumber) / Math.log(10) + 1)
            );
            maximumFractionDigits = Math.max(
                maximumFractionDP,
                repeatCount + 1
            );
        }
    }

    if (format) {
        const valueFormatted = numeral(valueNumber).format(format);
        // workaround for small numbers and NaN https://github.com/adamwdraper/Numeral-js/issues/596
        return valueFormatted !== "NaN" ? valueFormatted : "0";
    } else {
        return valueNumber.toLocaleString("en-US", { maximumFractionDigits });
    }
}

export function truncateAddress(
    address: string,
    startLength = 6,
    endLength = 4
): string {
    if (!address) return "";
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
