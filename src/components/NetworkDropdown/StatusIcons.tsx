import * as React from "react";

const ActiveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        {...props}
    >
        <circle cx={12} cy={12} r={0} fill="currentColor">
            <animate
                attributeName="r"
                dur="1.2s"
                from={0}
                repeatCount="indefinite"
                to={11}
            />
            <animate
                attributeName="opacity"
                dur="1.2s"
                from={1}
                repeatCount="indefinite"
                to={0}
            />
        </circle>
    </svg>
);

const InactiveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        {...props}
    >
        <path
            fill="currentColor"
            d="M12 21 0 9q2.375-2.425 5.488-3.713T12 4t6.513 1.288T24 9l-3.7 3.7q-.425-.125-.875-.2t-.925-.075q-2.525 0-4.3 1.763T12.425 18.5q0 .475.075.925t.2.875zm4.4 1L15 20.6l2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.075 2.1L22 20.6 20.6 22l-2.1-2.075z"
        />
    </svg>
);

const PendingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        {...props}
    >
        <path
            fill="none"
            stroke="currentColor"
            strokeDasharray={16}
            strokeDashoffset={16}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3a9 9 0 0 1 9 9"
        >
            <animate
                fill="freeze"
                attributeName="stroke-dashoffset"
                dur="0.2s"
                values="16;0"
            />
            <animateTransform
                attributeName="transform"
                dur="1.5s"
                repeatCount="indefinite"
                type="rotate"
                values="0 12 12;360 12 12"
            />
        </path>
    </svg>
);

export { ActiveIcon, InactiveIcon, PendingIcon };
