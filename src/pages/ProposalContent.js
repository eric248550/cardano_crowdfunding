import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Routes, Route, useParams } from 'react-router-dom';

import AlertModal from "../alert";
import MultipleWalletApi, { Cardano } from '../nami-js/nami';
let walletApi;
import { useSearchParams } from "react-router-dom";


export default function Proposals() {
    try {
        let { proposalId } = useParams();
        let [searchParams, setSearchParams] = useSearchParams();
        const project = JSON.parse(decodeURI(searchParams.get('project')));

        const [balance, setBalance] = useState();
        const [localStorageChange, setLocalStorageChange] = useState(false);
        const [alertInformation, setAlertInformation] = useState({
            content: "",
            isDisplayed: false,
            type: "information",
        });
        const [proposalContent, setProposalContent] = useState();
        const [voteList, setVoteList] = useState();
        const [voteNumber, setVoteNumber] = useState();
        const [totalVote, setTotalVote] = useState();

        useEffect (() => {
            getProposalContent();
            getVoteList();
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

        async function getProposalContent() {
            try {
                const response = await (await fetch(
                    // `http://localhost:8787/gov3/GetProposal/${proposalId}`,
                    `https://api.aidev-cardano.com/gov3/GetProposal/${proposalId}`
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
                setProposalContent(response);
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

        async function getVoteList() {
            try {
                const response = await (await fetch(
                    // `http://localhost:8787/gov3/GetVotes/${proposalId}`,
                    `https://api.aidev-cardano.com/gov3/GetVotes/${proposalId}`
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
                setVoteList(response);
                if (response.length > 0) {
                    let number_array = [];
                    let total = 0;
                    for (let data of response) {
                        if (number_array[data.choice]) number_array[data.choice] += data.power;
                        else number_array[data.choice] = data.power;

                        total += data.power;
                    }
                    setVoteNumber(number_array);
                    setTotalVote(total);
                }

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

        function ChoiceComponent() {
            try {
                return (
                    (JSON.parse(proposalContent.choices)).map((choice, index) => {
                        return (
                            <div className='m-auto mt-3 w-11/12'>
                                <div className='flex flex-row justify-between'>
                                    <div className='flex flex-col'>
                                        <p className='text-black text-base'>{choice}</p>
                                        <p className='text-[#acacac] text-sm'>{voteNumber? voteNumber[index] :0}</p>
                                    </div>
                                    <button onClick={() => {vote(index)}} className='rounded-[200px] flex w-20 h-8 shadow-sm shadow-indigo-500 text-[#522c99] bg-gradient-to-r from-[#4235e1] to-[#faf9ff] hover:animate-pulse transition-all hover:bg-gradient-to-t0'>
                                        <p className='m-auto text-base text-white'>
                                            vote
                                        </p>
                                    </button>
                                </div>


                                <div className='flex flex-row'>
                                    <div className='mt-2 m-auto rounded-lg w-11/12 bg-[#faf9ff] h-2'>
                                        <div style={{ width: `${ (voteNumber && totalVote)?  progressBarWidth(voteNumber[index], totalVote): 0}%`}} 
                                            className={`bg-[#4235e1] flex rounded-md h-full`}>
                                        </div>
                                    </div>
                                    <p className='m-auto'>
                                    {`${ (voteNumber && totalVote)?  progressBarWidth(voteNumber[index], totalVote): 0}%`}
                                    {/* {console.log(totalVote)} */}
                                    </p>
                                </div>

                            </div>
                        )
                    })
                )
            }
            catch (e) {
                console.log(e);
                return "error"
            }
        }

        async function vote(choice) {
            try {
                setAlertInformation({
                    type: "loading",
                    isDisplayed: true,
                    content: null,
                });

                if (!walletApi) {
                    setAlertInformation({
                        type: "information",
                        isDisplayed: true,
                        content: `Connect wallet first`,
                    });
                    return;
                }

                if (!project || !proposalId) {
                    console.log(project, proposalId)
                    setAlertInformation({
                        type: "information",
                        isDisplayed: true,
                        content: `Something went wrong`,
                    });
                    return;
                }

                const sign_data = await walletApi.signData(`vote:proposal_${proposalId},choice_${choice}`);

                const myAddress = await walletApi.getAddress();

                const body = {
                    'address': myAddress,
                    'project_id': parseInt(project.id),
                    'proposal_id': parseInt(proposalId),
                    'choice': choice,
                    'key': sign_data.key,
                    'signature': sign_data.signature,
                }
                const data = await (await fetch(
                    // 'http://localhost:8787/gov3/Vote',
                    'https://api.aidev-cardano.com/gov3/Vote',
                    {
                        method:'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body)
                    }
                )).json();

                if (data.error) {
                    console.log(data.error);
                    setAlertInformation({
                        type: "information",
                        isDisplayed: true,
                        content: `${data.error}`,
                    });
                    return;
                }
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `Vote successfully`,
                });
            }
            catch (e) {
                if (e.info) e = e.info;
                console.log(e)
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `${e}`,
                });
            }
        }
        return (
            <div className="min-h-screen bg-cover bg-[url('./images/background.svg')]">
                <div className='p-5'></div>

                <div className='flex flex-col md:flex-row'>
                    <div className='flex flex-col w-full md:w-2/3'>
                        {proposalContent
                        ?
                            <div className='mx-auto w-11/12'>
                                {/* status */}
                                <div>
                                    {(timeToStatus(proposalContent.start_time_unix, proposalContent.end_time_unix) === 'active')
                                    ?
                                        <div className='flex flex-row'>
                                            <div className='w-14 h-6 bg-[#f1ffed] border-[#a2d799] border-[1px] rounded-lg'>
                                                <p className='my-auto text-center text-sm text-[#3f7f54]'>
                                                    active
                                                </p>
                                            </div>
                                            <p className='ml-5 my-auto text-black text-base'>
                                                End {time2TimeAgo(proposalContent.end_time_unix)}
                                            </p>
                                        </div>
                                    :""
                                    }
                                    {(timeToStatus(proposalContent.start_time_unix, proposalContent.end_time_unix) === 'end')
                                    ?
                                        <div className='flex flex-row'>
                                            <div className='w-14 h-6 bg-[#f0eff8] border-[#7c788c] border-[1px] rounded-lg'>
                                                <p className='my-auto text-center text-sm text-[#7c788c]'>
                                                    end
                                                </p>
                                            </div>
                                            <p className='ml-5 my-auto text-black text-base'>
                                                Ended {time2TimeAgo(proposalContent.end_time_unix)}
                                            </p>
                                        </div>
                                    :""
                                    }
                                    {(timeToStatus(proposalContent.start_time_unix, proposalContent.end_time_unix) === 'pending')
                                    ?
                                        <div className='flex flex-row'>
                                            <div className='w-14 h-6 bg-[#f0eff8] border-[#7c788c] border-[1px] rounded-lg'>
                                                <p className='my-auto text-center text-sm text-[#7c788c]'>
                                                    pending
                                                </p>
                                            </div>
                                            <p className='ml-5 my-auto text-black text-base'>
                                                Start {time2TimeAgo(proposalContent.start_time_unix)}
                                            </p>
                                        </div>
                                    :""
                                    }
                                </div>
                                {/* title */}
                                <p className='mt-3 text-3xl text-black'>
                                    {proposalContent.title}
                                </p>
                                <Link to={`/user/${proposalContent.address}`} className='mt-5 text-sm text-blue-700'>
                                    by {proposalContent.address.slice(0,10)}...
                                </Link>
                                <pre className='whitespace-pre-wrap break-normal mt-10 text-base text-black'>
                                    {proposalContent.description}
                                </pre>
                            </div>
                        :null
                        }
                    </div>
                    <div className='m-auto w-full md:w-1/3 flex flex-col'>
                        <div className='mt-10 shadow-xl bg-white mx-auto w-11/12 flex flex-col rounded-xl border-[1px] border-[#acacac]'>
                            <p className='text-xl text-center text-[#acacac]'>Voting Power</p>
                            <p className='my-5 text-xl text-center text-blue-400'>{(balance && project)? calVotingPower(balance, project) :0}</p>
                        </div>
                        {/* Result percentage/number of each choice */}
                        <div className='mt-5 shadow-xl bg-white mx-auto w-11/12 flex flex-col rounded-xl border-[1px] border-[#acacac]'>
                            <div className='flex w-full rounded-t-xl border-[#acacac] border-b-[1px]'>
                                <p className='m-auto text-center my-2 text-[#acacac] text-lg'>
                                    Current Result
                                </p>
                            </div>
                            {proposalContent
                            ?
                                <ChoiceComponent/>
                            :null
                            }
                        </div>

                        {/* Voter list/power */}
                        <div className="mt-5 mb-5 shadow-xl bg-white mx-auto w-11/12 flex flex-col rounded-xl border-[1px] border-[#acacac]">
                            <div className="border-b-2 border-gray-400">
                                <div className='flex'>
                                    <div className="ml-2 w-1/3 mx-auto">
                                        <p className='font-semibold text-sm'>
                                            Voter
                                        </p>
                                    </div>
                                    <div className="ml-2 w-1/3 mx-auto">
                                        <p className='font-semibold text-sm'>
                                            Vote for
                                        </p>
                                    </div>
                                    <div className="ml-2 w-1/3 mx-auto">
                                        <p className='font-semibold text-sm'>
                                            Cast Power
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className=''>
                                {voteList?
                                voteList.map((voter) => {
                                    return (
                                        <div className="flex my-3 hover:border-[1px]">
                                            <div className="ml-2 w-1/3 text-sm">
                                                <p className='text-left text-sm'>
                                                    {voter.address.slice(0,10)}...
                                                </p>
                                            </div>
                                            <div className="ml-2 w-1/3 text-sm">
                                                <p className='text-left text-sm'>
                                                    {voter.choice_name}
                                                </p>
                                            </div>
                                            <div className="ml-2 w-1/3 text-sm">
                                                <p className='text-left text-sm'>
                                                    {voter.power}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                                :null
                                }
                            </div>
                        </div>

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
        console.log(e);
        return "error"
    }
}

function timeToStatus(start_time_unix, end_time_unix) {
    const now = new Date();
    const now_unix = now.getTime();

    if (end_time_unix < now_unix) return 'end';
    else if (start_time_unix > now_unix) return 'pending';
    else return 'active';
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

function progressBarWidth(remain, allVotes) {
    if (!remain || !allVotes) return 0;
    if (allVotes === 0) return 0;
    const percentage = 100 * remain / allVotes;
    return percentage.toFixed(1);
}