import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Routes, Route, useParams } from 'react-router-dom';

import AlertModal from "../alert";
import MultipleWalletApi, { Cardano } from '../nami-js/nami';
let walletApi;
import { useSearchParams } from "react-router-dom";


export default function Proposals() {
    try {
        let { projectId } = useParams();
        let [searchParams, setSearchParams] = useSearchParams();
        const project = JSON.parse(decodeURI(searchParams.get('project')));

        const [balance, setBalance] = useState();
        const [localStorageChange, setLocalStorageChange] = useState(false);
        const [alertInformation, setAlertInformation] = useState({
            content: "",
            isDisplayed: false,
            type: "information",
        });
        const [proposalList, setProposalList] = useState()

        useEffect (() => {
            getProposalList()
        }, [])

        useEffect(() => {
            csl();
            let walletBalance_str = localStorage.getItem('balance');
            if (walletBalance_str) setBalance(JSON.parse(walletBalance_str));

            window.addEventListener('storage', () => {
                // console.log("change to local storage!");
                setLocalStorageChange(!localStorageChange);
            })
    
            return () => {
                window.removeEventListener('storage', null)
            }
        },[localStorageChange]);

        async function csl() {
            try {    
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
                }
            }
            catch (e) {
                console.log(e)
                if (e.info) e = e.info;
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `${e}`,
                });
            }
        }

        async function getProposalList() {
            try {
                const response = await (await fetch(
                    // `http://localhost:8787/gov3/GetProposalList/${projectId}`,
                    `https://api.aidev-cardano.com/gov3/GetProposalList/${projectId}`
                )).json();

                if (response.error) {
                    console.log(response.error);
                    setAlertInformation({
                        type: "information",
                        isDisplayed: true,
                        content: `${response.error}`,
                    });
                    return;
                }
                setProposalList(response);
            }
            catch (e) {
                console.log(e)
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `${e}`,
                });
            }
        }

        function calVotingPower(balance, project) {
            if (project.vote_asset_unit === 'lovelace') {
                return (parseInt(balance.lovelace) / 1000000).toFixed(0)
            }
            else {
                let power = 0;
                for (let asset of balance.assets) {
                    if (project.vote_asset_unit === asset.policy) {
                        power += parseInt(asset.quantity)
                    }
                }
                return power;
            }
        }

        function Proposal(props) {
            return (
                <div>
                    {props.proposals?
                        props.proposals.map((proposal) => {
                            const now = new Date();
                            const now_unix = now.getTime();
                            let status;
        
                            if (proposal.end_time_unix < now_unix) status = 'end';
                            else if (proposal.start_time_unix > now_unix) status = 'pending';
                            else status='active';
        
                            return(
                                <Link className='shadow-xl bg-white m-auto w-11/12 mt-2 flex flex-col rounded-xl border-[1px] border-[#acacac] hover:brightness-125'
                                    to={`/proposal/${proposal.id}?project=${encodeURIComponent(JSON.stringify(project))}`}
                                >
                                    {/* <div className='my-3 w-full border-[1px] border-[acacac]'></div> */}
                                    <div className='m-auto flex flex-row'>
                                        <p className='text-black text-base'>by</p>
                                        <p className='ml-2 text-blue-600 text-base'>{proposal.address.slice(0,10)}</p>
        
                                     
                                        {(status==='active')
                                        ?
                                            <p className='ml-2 my-auto text-black text-xs'>
                                                End {time2TimeAgo(proposal.end_time_unix)}
                                            </p>
                                        :null
                                        }
        
                                        {(status==='pending')
                                        ?
                                            <p className='ml-2 my-auto text-black text-xs'>
                                                Start {time2TimeAgo(proposal.start_time_unix)}
                                            </p>
                                        :null
                                        }
        
                                        {(status==='end')
                                        ?
                                            <p className='ml-2 my-auto text-black text-xs'>
                                                Ended {time2TimeAgo(proposal.end_time_unix)}
                                            </p>
                                        :null
                                        }
        
                                    </div>
        
                                    <div className='m-auto flex flex-row justify-between'>
                                        {(status==='active')
                                        ?
                                            <p className='text-l sm:text-xl text-green-400 font-bold sm:font-extrabold'>
                                                {`[${status}]`}
                                            </p>
                                        :
                                            <p className='text-l sm:text-xl text-red-400 font-bold sm:font-extrabold'>
                                                {`[${status}]`}
                                            </p>
                                        }
        
                                        <p className='ml-2 text-l sm:text-xl text-black font-bold sm:font-extrabold'>
                                            {proposal.title}
                                        </p>
                                        {/* <p className='m-5 text-md text-[#004D65]'>
                                            {`${data.hold} NFTs / ${(balance.ada * data.hold * data.weight).toFixed(0)} XP per epoch`}
                                        </p> */}
        
                                    </div>
                                </Link>
                            )
                        })
                        :""
                    }
                </div>
        
            );
        }

        return (
            <div className="min-h-screen bg-cover bg-[url('./images/background.svg')]">
                <div className='p-5'></div>

                <div className='flex flex-row'>
                    <div className='flex flex-col w-2/3'>
                        <p className='ml-2 text-left text-2xl font-bold text-black'>
                            {project? project.name:""}'s Proposals
                        </p>
                        {proposalList? <Proposal proposals={proposalList}/> : ""}
                        
                    </div>
                    <div className='w-1/3 flex flex-col'>
                        <div className='mt-10 shadow-xl bg-white m-auto w-11/12 mt-2 flex flex-col rounded-xl border-[1px] border-[#acacac]'>
                            <p className='text-xl text-center text-[#acacac]'>Voting Power</p>
                            <p className='my-5 text-xl text-center text-blue-400'>{(balance && project)? calVotingPower(balance, project) :0}</p>
                        </div>

                        <Link className='mt-2 rounded-[200px] flex m-auto w-11/12 h-12 shadow-sm shadow-indigo-500 text-[#522c99] text-2xl font-semibold bg-gradient-to-b from-[#DA8CFF] to-[#B8F2FA] hover:animate-pulse transition-all hover:bg-gradient-to-t hover:duration-1000'
                            to={`/create_proposal/${projectId}`}
                        >
                            <p className='m-auto text-xs md:text-lg'>
                                Create Proposal
                            </p>
                        </Link>
                        
                    </div>
                </div>


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
            </div>


        );
    }
    catch (e) {
        console.log(e)
    }
}




function time2TimeAgo(ts) {
    // This function computes the delta between the
    // provided timestamp and the current time, then test
    // the delta for predefined ranges.

    var d=new Date();  // Gets the current time
    var nowTs = Math.floor(d.getTime()); // getTime() returns milliseconds, and we need seconds, hence the Math.floor and division by 1000
    var seconds = (nowTs - ts) / 1000;

    if (seconds > 0) {
        // more that two days
        if (seconds > 2*24*3600) {
        //    return "a few days ago";
           return Math.floor(seconds/60/60/24) + " days ago";
        }
        // a day
        if (seconds > 24*3600) {
           return "yesterday";
        }
    
        if (seconds > 3600) {
           return Math.floor(seconds/60/60) + " hours ago";
        }
        if (seconds > 60) {
           return Math.floor(seconds/60) + " minutes ago";
        }
    
        if (seconds < 60) {
           return seconds + "seconds ago";
        }
    }
    else {
        seconds = -seconds;
        if (seconds > 2*24*3600) {
        //    return "a few days ago";
            return `in ${Math.floor(seconds/60/60/24)} days`;
        }
        // a day
        if (seconds > 24*3600) {
            return "yesterday";
        }
        if (seconds > 3600) {
            return `in ${Math.floor(seconds/60/60)} hours`;
        }
        if (seconds > 60) {
            return `in ${Math.floor(seconds/60)} minutes`;
        }
    
        if (seconds < 60) {
            return `in ${seconds} seconds`;
        }
    }


}
