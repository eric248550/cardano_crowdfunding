
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const verifyDataSignature = require('@cardano-foundation/cardano-verify-datasignature');

const Pool = require("pg").Pool;
const connectionString = process.env.URI;
const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

var NamiWalletApi = require('../nami-node-js/nami').NamiWalletApi
let blockfrostApiKey = {
  0: process.env.testBlockfrost , // testnet
  1: process.env.mainBlockfrost , // mainnet
}
let nami = new NamiWalletApi( blockfrostApiKey ) 
const utils = require('./utils.js');

const cardano_transaction_timeout = 600000;
const projectName = 'gov3';
const db_user = 'gov3_user';
const db_delegation = 'gov3_delegation';
const db_project = 'gov3_project';
const db_proposal = 'gov3_proposal';
const db_vote = 'gov3_vote';
const db_delegateVote = 'gov3_vote_delegate';

const networkId = 1;



module.exports = function(app){

    // -------- profile page --------
    app.get('/gov3/User/:address', async (req, res) => {
        try {
            const {address} = req.params;

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const userData = await utils.postgreDB(`SELECT * FROM ${db_user} WHERE stake_address='${stake_address}'`)
            if (userData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow user',
                }); 
                return;
            }
            res.status(200).send(userData[0]); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/User unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    app.post('/gov3/EditUser', async (req, res) => {
        try {
            const address = req.body.address;
            const display_name = (req.body.display_name).replace(/\'/g, '\'\'');
            const about = (req.body.about).replace(/\'/g, '\'\'');
            const key = req.body.key;
            const signature = req.body.signature;

            const verify_message = `edit_user_profile`;

            if (!verifyDataSignature(signature, key, verify_message, address)) {
                res.status(500).send({
                    "error": `Signature not match`,
                });
                return;
            }

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const r1 = await utils.postgreDB(`INSERT INTO ${db_user}
                (address, stake_address, display_name, about)
                VALUES ('${address}', '${stake_address}', '${display_name}', '${about}')
                ON CONFLICT (stake_address) DO UPDATE 
                SET display_name = '${display_name}', about='${about}'
            `);

            if (!r1) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }

            res.status(200).send({
                "message": 'Update successfully',
            }); 
        }
        catch (e) {
            console.log(`${projectName} EditUser unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    })
    app.get('/gov3/Delegation/User/:address', async (req, res) => {
        try {
            const {address} = req.params;

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const delegationData = await utils.postgreDB(`SELECT gov3_delegation.project, gov3_delegation.presentation, gov3_project.icon
                FROM gov3_delegation
                INNER JOIN gov3_project ON gov3_delegation.project=gov3_project.name
                WHERE stake_address='${stake_address}'
            `)
            if (!delegationData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (delegationData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow user',
                }); 
                return;
            }
            res.status(200).send(delegationData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/Delegation/User unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    app.post('/gov3/Delegation/EditUser', async (req, res) => {
        try {
            const address = req.body.address;
            const project = req.body.project;
            const project_id = req.body.project_id;
            const presentation = (req.body.presentation).replace(/\'/g, '\'\'');
            const key = req.body.key;
            const signature = req.body.signature;

            const verify_message = `edit_delegation`;

            if (!verifyDataSignature(signature, key, verify_message, address)) {
                res.status(500).send({
                    "error": `Signature not match`,
                });
                return;
            }

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const id = `${project}_${stake_address}`
            const r1 = await utils.postgreDB(`INSERT INTO ${db_delegation}
                (id, stake_address, project, presentation, address, project_id)
                VALUES ('${id}', '${stake_address}', '${project}', '${presentation}', '${address}', ${project_id})
                ON CONFLICT (id) DO UPDATE 
                SET presentation='${presentation}'
            `);

            if (!r1) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }

            res.status(200).send({
                "message": 'Update successfully',
            }); 
        }
        catch (e) {
            console.log(`${projectName}/Delegation/EditUser unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    })
    // -------- other user page --------
    app.get('/gov3/GetUserVote/:address', async (req, res) => {
        try {
            const {address} = req.params;

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const voteData = await utils.postgreDB(`SELECT gov3_vote.choice_name, gov3_proposal.title, gov3_vote.power, gov3_vote.time_unix, gov3_project.icon, gov3_project.name
                FROM ((gov3_vote
                INNER JOIN gov3_proposal ON gov3_vote.proposal_id=gov3_proposal.id)
                INNER JOIN gov3_project ON gov3_proposal.project_id=gov3_project.id)
                WHERE gov3_vote.stake_address='${stake_address}'
            `)
            if (!voteData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (voteData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow user',
                }); 
                return;
            }
            res.status(200).send(voteData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/GetVotes unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    app.get('/gov3/GetUserProposal/:address', async (req, res) => {
        try {
            const {address} = req.params;

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const proposalData = await utils.postgreDB(`SELECT gov3_proposal.title, gov3_proposal.start_time_unix, gov3_project.icon, gov3_project.name
                FROM gov3_proposal
                INNER JOIN gov3_project ON gov3_proposal.project_id=gov3_project.id
                WHERE stake_address='${stake_address}'
            `)
            if (!proposalData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (proposalData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow user',
                }); 
                return;
            }
            res.status(200).send(proposalData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/GetVotes unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    // -------- delegate page --------
    app.get('/gov3/GetDelegateList', async (req, res) => {
        try {
            const delegatelData = await utils.postgreDB(`SELECT * FROM ${db_delegation}`)

            if (!delegatelData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (delegatelData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow user',
                }); 
                return;
            }
            res.status(200).send(delegatelData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/GetVotes unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    app.get('/gov3/GetDelegateVote/:address', async (req, res) => {
        try {
            const {address} = req.params;

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const delegateVoteData = await utils.postgreDB(`SELECT * FROM ${db_delegateVote}
                WHERE from_stake_address='${stake_address}'
            `)

            if (!delegateVoteData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (delegateVoteData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow delegate',
                }); 
                return;
            }
            res.status(200).send(delegateVoteData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/GetVotes unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    app.post('/gov3/DelegateVote/Edit', async (req, res) => {
        try {
            const address = req.body.address;
            const to_address = req.body.to_address;
            const project_id = req.body.project_id;
            const key = req.body.key;
            const signature = req.body.signature;

            const verify_message = `DelegateVote/Edit`;

            if (!verifyDataSignature(signature, key, verify_message, address)) {
                res.status(500).send({
                    "error": `Signature not match`,
                });
                return;
            }

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const to_stake_address = await utils.addressToStake(to_address, networkId);
            if (!to_stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const delegate_id = `${project_id}_${stake_address}`
            const r1 = await utils.postgreDB(`INSERT INTO ${db_delegateVote}
                (project_id, from_address, from_stake_address, to_address, to_stake_address, delegate_id)
                VALUES (${project_id}, '${address}', '${stake_address}', '${to_address}', '${to_stake_address}', '${delegate_id}')
                ON CONFLICT (delegate_id) DO UPDATE 
                SET to_address='${to_address}', to_stake_address='${to_stake_address}'
            `);

            if (!r1) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }

            res.status(200).send({
                "message": 'delegate successfully',
            }); 
        }
        catch (e) {
            console.log(`gov3/DelegateVote/Edit unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    })
    app.post('/gov3/DelegateVote/Cancel', async (req, res) => {
        try {
            const address = req.body.address;
            const project_id = req.body.project_id;
            const key = req.body.key;
            const signature = req.body.signature;

            const verify_message = `DelegateVote/Cancel`;

            if (!verifyDataSignature(signature, key, verify_message, address)) {
                res.status(500).send({
                    "error": `Signature not match`,
                });
                return;
            }

            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const delegate_id = `${project_id}_${stake_address}`
            const r1 = await utils.postgreDB(`DELETE FROM ${db_delegateVote}
                WHERE delegate_id='${delegate_id}'
            `);

            if (!r1) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }

            res.status(200).send({
                "message": 'Cancel successfully',
            }); 
        }
        catch (e) {
            console.log(`gov3/DelegateVote/Edit unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    })
    // -------- project page --------
    app.get('/gov3/GetProjectList', async (req, res) => {
        try {
            const projectData = await utils.postgreDB(`SELECT * FROM ${db_project}`)
            if (!projectData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            res.status(200).send(projectData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/Delegation/User unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    // -------- Proposal page --------
    app.post('/gov3/CreateProposal', async (req, res) => {
        try {
            const address = req.body.address;
            const project_id = req.body.project_id;
            const title = (req.body.title).replace(/\'/g, '\'\'');
            const description = (req.body.description).replace(/\'/g, '\'\'');
            const choices = (req.body.choices).replace(/\'/g, '\'\'');
            const start_time_str = req.body.start_time_str;
            const start_time_unix = req.body.start_time_unix;
            const end_time_str = req.body.end_time_str;
            const end_time_unix = req.body.end_time_unix;
            const key = req.body.key;
            const signature = req.body.signature;

            const verify_message = `CreateProposal:project_${project_id}`;

            if (!verifyDataSignature(signature, key, verify_message, address)) {
                res.status(500).send({
                    "error": `Signature not match`,
                });
                return;
            }
            
            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const projectData = await utils.postgreDB(`SELECT * FROM ${db_project} WHERE id=${project_id}`)
            if (!projectData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (projectData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow porject',
                }); 
                return;
            }
            const proposal_asset_unit = projectData[0].proposal_asset_unit;
            const proposal_asset_quantity = projectData[0].proposal_asset_quantity;

            if (proposal_asset_unit === 'lovelace') {
                const account = await utils.blockRequest(`/accounts/${stake_address}`, networkId);
                const ada = (parseInt(account.controlled_amount) / 1000000).toFixed(0);
                
                if (ada < proposal_asset_quantity) {
                    res.status(500).send({
                        "error": 'Not meet Proposal requirement',
                    }); 
                    return;
                }
            }
            else {
                let voter_asset_amount = 0;
                for (let k = 1; k < 99; k++) {
                    const assets = await utils.blockRequest(`/accounts/${stake_address}/addresses/assets?page=${k}`, networkId);
                    // break if this page have no asset
                    if(assets.length === 0) break;
    
                    // delegator's assets
                    for (let l = 0; l < assets.length; l++) {
                        const policyId = assets[l].unit.slice(0, 56);
                        const quantity = Number(assets[l].quantity);
    
                        if (policyId === proposal_asset_unit) {
                            voter_asset_amount += quantity;
                        }
                    }
                }
    
                if (voter_asset_amount < proposal_asset_quantity) {
                    res.status(500).send({
                        "error": 'Not meet Proposal requirement',
                    }); 
                    return;
                }
            }


            const r1 = await utils.postgreDB(`INSERT INTO ${db_proposal}
                (project_id, title, description, choices, start_time_unix, start_time_str, end_time_unix, end_time_str, address, stake_address)
                VALUES (${project_id}, '${title}', '${description}', '${choices}', ${start_time_unix}, '${start_time_str}', ${end_time_unix}, '${end_time_str}', '${address}', '${stake_address}')
            `);

            if (!r1) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }

            res.status(200).send({
                "message": 'Update successfully',
            }); 
        }
        catch (e) {
            console.log(`${projectName}/CreateProposal unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    })
    app.get('/gov3/GetProposalList/:project_id', async (req, res) => {
        try {
            const {project_id} = req.params;

            const proposalData = await utils.postgreDB(`SELECT * FROM ${db_proposal} WHERE project_id=${project_id} order by start_time_unix desc`)
            if (!proposalData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            res.status(200).send(proposalData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/Delegation/User unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    app.get('/gov3/GetProposal/:proposalId', async (req, res) => {
        try {
            const {proposalId} = req.params;

            const proposalData = await utils.postgreDB(`SELECT * FROM ${db_proposal} WHERE id=${proposalId}`)
            if (!proposalData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            res.status(200).send(proposalData[0]); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/Delegation/User unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    // -------- Proposal content page --------
    app.get('/gov3/GetVotes/:proposalId', async (req, res) => {
        try {
            const {proposalId} = req.params;

            const votesData = await utils.postgreDB(`SELECT * FROM ${db_vote} WHERE proposal_id=${proposalId}`)
            if (!votesData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            res.status(200).send(votesData); 
            return;
        }
        catch (e) {
            console.log(`${projectName}/Delegation/User unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    });
    app.post('/gov3/Vote', async (req, res) => {
        try {
            const address = req.body.address;
            const project_id = req.body.project_id;
            const proposal_id = req.body.proposal_id;
            const choice = parseInt(req.body.choice);
            const key = req.body.key;
            const signature = req.body.signature;

            const verify_message = `vote:proposal_${proposal_id},choice_${choice}`;

            if (!verifyDataSignature(signature, key, verify_message, address)) {
                res.status(500).send({
                    "error": `Signature not match`,
                });
                return;
            }
            
            const stake_address = await utils.addressToStake(address, networkId);
            if (!stake_address) {
                res.status(500).send({
                    "error": `Address format incorrect, Wrong Network`,
                });
                return;
            }

            const now = new Date();
            const now_unix = now.getTime();
            const now_str = now.toString();
            const vote_id = `${proposal_id}_${stake_address}`

            const proposalData = await utils.postgreDB(`SELECT * FROM ${db_proposal} WHERE id=${proposal_id}`)
            if (!proposalData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (proposalData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow proposal',
                }); 
                return;
            }
            if (now_unix < proposalData[0].start_time_unix || now_unix > proposalData[0].end_time_unix) {
                res.status(500).send({
                    "error": 'Vote not live now',
                }); 
                return;
            }
            const choice_name = JSON.parse(proposalData[0].choices)[choice];

            const projectData = await utils.postgreDB(`SELECT * FROM ${db_project} WHERE id=${project_id}`)
            if (!projectData) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }
            if (projectData.length <= 0) {
                res.status(500).send({
                    "error": 'Unknow porject',
                }); 
                return;
            }
            const vote_asset_unit = projectData[0].vote_asset_unit;
            let vote_power = 0;
            if (vote_asset_unit === 'lovelace') {
                const account = await utils.blockRequest(`/accounts/${stake_address}`, networkId);
                const ada = (parseInt(account.controlled_amount) / 1000000).toFixed(0);
                vote_power = ada;
            }
            else {
                let voter_asset_amount = 0;
                for (let k = 1; k < 99; k++) {
                    const assets = await utils.blockRequest(`/accounts/${stake_address}/addresses/assets?page=${k}`, networkId);
                    
                    // break if this page have no asset
                    if(assets.length === 0) break;
    
                    // delegator's assets
                    for (let l = 0; l < assets.length; l++) {
                        const policyId = assets[l].unit.slice(0, 56);
                        const quantity = Number(assets[l].quantity);
    
                        if (policyId === vote_asset_unit) {
                            voter_asset_amount += quantity;
                        }
                    }
                }
                vote_power = voter_asset_amount;
            }

            if (vote_power <= 0) {
                res.status(500).send({
                    "error": 'You have no voting power',
                }); 
                return;
            }

            const r1 = await utils.postgreDB(`INSERT INTO ${db_vote}
                (vote_id, proposal_id, choice, power, address, stake_address, time_unix, time_str, project_id, choice_name)
                VALUES ('${vote_id}', ${proposal_id}, ${choice}, ${vote_power}, '${address}', '${stake_address}', ${now_unix}, '${now_str}', ${project_id}, '${choice_name}')
                ON CONFLICT (vote_id) DO UPDATE 
                SET choice = ${choice}, power=${vote_power}, time_unix=${now_unix}, time_str='${now_str}', choice_name='${choice_name}'
            `);

            if (!r1) {
                res.status(500).send({
                    "error": 'Database error',
                }); 
                return;
            }

            res.status(200).send({
                "message": 'Vote successfully',
            }); 
        }
        catch (e) {
            console.log(`${projectName}/Vote unexpected error: ${e}`);
            res.status(500).send({
                "error": `Unexpected error: ${e}`,
            })
        }
    })
}
