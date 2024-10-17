exports.Passwordpattern =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#%?^-_/$&*]).{8,}$/;
exports.Emailpattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
exports.Namepattern = /^[a-zA-Z][a-zA-Z][a-zA-Z ]{0,18}$/i;
exports.Mobilepattern = /^[1-9]\d{9}$/;
