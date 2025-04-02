import { ChangeEvent, KeyboardEvent } from "react";
import { twMerge } from "tailwind-merge";
import { Input } from "../ui/input";

type INumericalInput = {
    value?: string;
    isError?: boolean;
    onUserInput: (value: string) => void;
    className?: string;
    placeholder?: string;
    integerOnly?: boolean;
};

const inputRegex = RegExp(`^\\d*$`); // match only digits
const decimalRegex = RegExp(`^\\d*\\.?\\d*$`); // match digits with optional decimal point

const NumericalInput: React.FC<INumericalInput> = ({
    value = "",
    isError,
    onUserInput,
    className = "",
    placeholder,
    integerOnly = false,
}) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        // Allow empty input
        if (input === "") {
            onUserInput("");
            return;
        }

        // For integer-only mode, only allow digits
        if (integerOnly) {
            if (inputRegex.test(input)) {
                const num = parseInt(input);
                if (num > 0 && num <= 100) {
                    onUserInput(input);
                }
            }
            return;
        }

        // For regular mode, allow decimal numbers
        if (decimalRegex.test(input)) {
            onUserInput(input);
        }
    };

    const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
        // Allow only digits and decimal point
        if (integerOnly) {
            if (!/^\d$/.test(e.key)) {
                e.preventDefault();
            }
        } else {
            if (!/^\d$/.test(e.key) && e.key !== ".") {
                e.preventDefault();
            }
        }
    };

    return (
        <Input
            // universal input options
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            // text-specific options
            type="text"
            pattern={integerOnly ? "^[0-9]*$" : "^[0-9]*\\.?[0-9]*$"}
            min="0"
            minLength={1}
            maxLength={79}
            spellCheck="false"
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            onKeyUp={handleKeyUp}
            className={twMerge(
                "text-base px-4",
                isError && "border-destructive focus-visible:ring-destructive",
                className
            )}
        />
    );
};

export default NumericalInput;
