import { SvgIconProps } from "./types";

const EditIcon = ({ className }: SvgIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      className={className}
    >
      <path
        d="m4.22 23.2-1.9 8.2a2.06 2.06 0 0 0 2 2.5 2.14 2.14 0 0 0 .43 0L13 32l15.84-15.78L20 7.4Z"
        className="clr-i-solid clr-i-solid-path-1"
      />
      <path
        d="m33.82 8.32-5.9-5.9a2.07 2.07 0 0 0-2.92 0L21.72 5.7l8.83 8.83 3.28-3.28a2.07 2.07 0 0 0-.01-2.93Z"
        className="clr-i-solid clr-i-solid-path-2"
      />
      <path fill="none" d="M0 0h36v36H0z" />
    </svg>
  );
};

export default EditIcon;
