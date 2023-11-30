import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import "./alert.css";

const AlertModal = ({
  children,
  onClose,
  type = "information",
  animateNumber,
  bgNumber,
}) => {
  // console.log(bgNumber, 'bg');
  function content() {
    switch (type) {
      case "information":
        return (
          <div className="whitespace-pre-line rounded-lg relative min-h-[11rem] bg-[#cacaca] flex-col flex m-auto w-4/5 border-2 border-r-4 border-b-4 border-black">
            <button className="alert-modal-close" onClick={onClose}>
              x
            </button>
            <div className="m-auto text-xl text-center">
            {children}

            </div>
          </div>
        );
      case "loading":
        return <div className="alert-modal-loading" />;
      case "animate":
        // console.log(animateNumber, "qwe");
        let imgSrc;
        let imgWidth;
        
        if (animateNumber <=1 ) imgWidth = "800px"
        else imgWidth = "400px"
        
        return <img src={imgSrc} width={imgWidth} />;
      case "result":
        return (
          <div className={`w-full`} >
            <button
              className="alert-modal-close"
              style={{ top: "6rem", right: "4rem" }}
              onClick={onClose}
            >
              x
            </button>
            {children}
          </div>
        );
    }
  }
  useEffect(() => {
    document.body.style = "overflow:hidden";
    return () => {
      document.body.style = "overflow:overlay";
    };
  }, []);
  return createPortal(
    <div className="alert-modal">{content()}</div>,
    document.getElementById("app")
  );
};

export default AlertModal;
