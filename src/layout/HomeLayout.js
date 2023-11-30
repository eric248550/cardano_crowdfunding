import React, { useEffect, useState } from 'react';
import { Outlet, Link } from "react-router-dom";


import namiIcon from "../images/wallet_icon/nami.png";
import eternlIcon from "../images/wallet_icon/eternl.png";
import typhonIcon from "../images/wallet_icon/typhon.png";
import flintIcon from "../images/wallet_icon/flint.png";
import geroIcon from "../images/wallet_icon/gero.png";
import nufiIcon from "../images/wallet_icon/nufi.png";
import walletIcon from "../images/wallet_icon/wallet.png";

import AlertModal from "../alert";
import MultipleWalletApi, { Cardano } from '../nami-js/nami';

import Dropdown from 'react-dropdown';

let walletApi;

const options = [
    { value: 'eternl', label: 
        <div className="justify-center flex flex-row items-center z-1000">
            <img src={eternlIcon} width={40} height={40}/>
            {/* <p>&nbsp;&nbsp;Eternl</p> */}
        </div>
    },
    { value: 'nami', label: 
        <div className="justify-center flex flex-row items-center">
            <img src={namiIcon} width={40} height={40}/>
            {/* <p>&nbsp;&nbsp;Nami</p> */}
        </div>
    },
    { value: 'typhoncip30', label: 
        <div className="justify-center flex flex-row items-center">
            <img src={typhonIcon} width={40} height={40}/>
            {/* <p>&nbsp;&nbsp;Typhon</p> */}
        </div>
    },
    { value: 'flint', label: 
        <div className="justify-center flex flex-row items-center">
            <img src={flintIcon} width={40} height={40}/>
            {/* <p>&nbsp;&nbsp;Flint</p> */}
        </div>
    },
    { value: 'gerowallet', label: 
        <div className="justify-center flex flex-row items-center">
            <img src={geroIcon} width={40} height={40}/>
            {/* <p>&nbsp;&nbsp;Gero</p> */}
        </div>
    },
    { value: 'nufi', label: 
    <div className="justify-center flex flex-row items-center">
        <img src={nufiIcon} width={40} height={40}/>
        {/* <p>&nbsp;&nbsp;Gero</p> */}
    </div>
},
]
export default function HomeLayout() {
    const [alertInformation, setAlertInformation] = useState({
        content: "",
        isDisplayed: false,
        type: "information",
    });
    const [userAdaDisplay, setUserAdaDisplay] = useState();

    function handleWallet(wallet) {
        const walletName = wallet.value;
        if (!window.cardano) {
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `You have no any Cardano wallet`,
            });
            return;
        }

        if (!window.cardano[walletName]) {
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `You have not installed ${walletName}`,
            });
            return;
        }

        localStorage.setItem('wallet', walletName);
        init_wallet();
    }
    // csl
    async function init_wallet() {
        try {
            setAlertInformation({
                type: "loading",
                isDisplayed: true,
                content: null,
            });

            const walletName = localStorage.getItem('wallet');
            if (walletName) {
                const S = await Cardano();

                walletApi = new MultipleWalletApi(
                    S,
                    window.cardano[walletName],
                    // blockfrostApiKey
                    {
                        0: "preprodTjTPf4nKUTGwgIFgk1wqIj4vtpHe9qi6", // testnet
                        1: "mainnetzPROg9q7idoA9ssVcWQMPtnawNVx0C0K", // mainnet
                    }
                );

                const balance = await walletApi.getBalance();
                setUserAdaDisplay((Number(balance.lovelace) / 1000000).toFixed(0));
                localStorage.setItem('balance', JSON.stringify(balance));

                window.dispatchEvent(new Event("storage"));


            }

            setAlertInformation({
                type: "loading",
                isDisplayed: false,
                content: null,
            });

        }
        catch (e) {
            console.log(123)
            console.log(e)
            if (e.info) e = e.info;
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `${e}`,
            });
            localStorage.setItem('wallet', '');
            setUserAdaDisplay('');
        }
    }
    function handelDefaultValue() {
        const walletName = localStorage.getItem('wallet');
    
        if (walletName === 'eternl') return 0;
        if (walletName === 'nami') return 1;
        if (walletName === 'typhoncip30') return 2;
        if (walletName === 'flint') return 3;
        if (walletName === 'gerowallet') return 4;
    
        return '';
    }
    useEffect(() => {
        init_wallet();
        handelDefaultValue();
    },[]);

    

    return (
        <div>
            {/* A "layout route" is a good place to put markup you want to
                share across all the pages on your site, like navigation. */}
            <nav className="bg-[#ffffff] flex-row">
                <ul className="overflow-hidden">
                    <li className="float-left">
                        <Link to="/">
                            <p className='m-4 text-4xl'>Gov3</p>
                        </Link>
                    </li>
                    <div className="flex flex-row float-right">
                        <li>
                            <Link to="/projects">
                                <p className="text-base text-black m-6">
                                    Projects
                                </p>
                            </Link>

                        </li>
                        <li>
                            <Link to="/delegate">
                                <p className="text-base text-black m-6">
                                    Delegate
                                </p>
                            </Link>
                        </li>

                        {/* Connect Wallet */}
                        <div className='w-40 m-4 flex flex-row rounded-2xl h-10'>
                            <Dropdown
                                className='hover:brightness-125 border-2 border-black w-10 absolute bg-white rounded-tl-xl rounded-bl-xl text-xl text-[#004D65]'
                                options={options}
                                onChange={handleWallet}
                                value={options[handelDefaultValue()]}
                                placeholder={
                                    <div className="justify-center flex flex-row items-center">
                                    <img src={walletIcon} width={40} height={40}/>
                                    {/* <p>&nbsp;&nbsp;Gero</p> */}
                                </div>
                                }
                            />
                            <div className='ml-10 w-32 bg-white hover:bg-[#c0c2c6] hover:bg-[#c0c2c6] border-r-2 border-t-2 border-b-2 border-black rounded-tr-xl rounded-br-xl h-10 hover:brightness-125'>
                                <Link to="/profile">
                                    <p className='mt-2 text-center text-black text-base'>
                                        {userAdaDisplay?
                                            `${userAdaDisplay}ADA`
                                            :"Disconnect"
                                        }
                                    </p>
                                </Link>
                            </div>

                        </div>
                    </div>
                </ul>
            </nav>
            <hr />
    
            {/* An <Outlet> renders whatever child route is currently active,
                so you can think about this <Outlet> as a placeholder for
                the child routes we defined above. */}
            <Outlet />
            {alertInformation.isDisplayed && (
                <AlertModal
                type={alertInformation.type}
                animateNumber={alertInformation.animateNumber}
                bgNumber={alertInformation.bgNumber}
                onClose={() =>
                    setAlertInformation({
                    type: "information",
                    isDisplayed: false,
                    content: null,
                    })
                }
                >
                {alertInformation.content}
                </AlertModal>
            )}
            <Footer />
        </div>
    );
}

function Footer() {
    return(
        <div className='relative bottom-0 w-full h-auto bg-[#121212]'>
            <div className='flex flex-row justify-center'>
                {/* <a href='https://twitter.com/AIDEV_cardano' target='_blank' className='flex flex-row justify-center'>
                    <p className='my-5 text-white text-base'>
                        Powered by AIDEV
                    </p>
                    <img className='mt-5 w-6 h-6' src={aiLogo}/>
                </a>
                <a href='https://twitter.com/lendingpond_ada' target='_blank' className='flex flex-row justify-center'>
                    <p className='mt-5 text-white text-base'>
                        and Stockpicka's Wallet
                    </p>
                    <img className='mt-5 w-6 h-6' src={pondLogo}/>
                </a> */}
                <p className='my-5 text-center text-white text-sm'>
                    © 2022 Gov3 All rights reserved
                </p>
            </div>

        </div>
    )
}