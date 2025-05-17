function BlobButton({ children, onClick, variant, disabled }) {
  const baseClass = "blob-btn relative overflow-hidden rounded-xl py-3 px-6 font-bold text-center transition-all duration-200 ease-out";
  const variantClass = variant === "long" 
    ? "bg-green-500 hover:bg-green-600 active:bg-green-700 text-white" 
    : "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white";
  
  const disabledClass = disabled 
    ? "opacity-70 cursor-not-allowed bg-gray-600 hover:bg-gray-600 active:bg-gray-600" 
    : "";
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${disabledClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

window.BlobButton = BlobButton;