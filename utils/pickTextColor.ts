const pickTextColor = (rgbColor: string) => {
  let color = rgbColor.charAt(0) === "#" ? rgbColor.substring(1, 7) : rgbColor;
  let r = parseInt(color.substring(0, 2), 16); // hexToR
  let g = parseInt(color.substring(2, 4), 16); // hexToG
  let b = parseInt(color.substring(4, 6), 16); // hexToB
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000" : "#FFF";
};

export default pickTextColor;
