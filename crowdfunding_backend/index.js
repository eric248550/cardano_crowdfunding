const express = require("express");
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

var cors = require('cors');
const app = express();
app.use( express.json() )
app.use(cors());
app.use(limiter);
// app.use( bodyParser.json() );       // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//   extended: true
// })); 
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({extended: true})); // to support URL-encoded bodies

// ------------------------- REST API ----------------------------------
// Check is alive
app.get('',  (req, res) => {
    res.status(200).send({
        "message": "alive",
    });
});

// -------------------------------------- NPD ---------------------------------------------
require('./routes/npd/npd_utils')(app);
// require('./routes/npd/amulet')(app);
require('./routes/npd/rugpull')(app);
require('./routes/npd/stake')(app);

// -------------------------------------- Darkbudz ---------------------------------------------
// require('./routes/darkbudz')(app);

// -------------------------------------- kannakrew ---------------------------------------------
require('./routes/kannakrew')(app);

// -------------------------------------- ADA Elementz -------------------------------------------------------
require('./routes/ada_elementz')(app);

// -------------------------------------- Send Token (NFTC, DEMON, ADAelementz) -------------------------------------------------------
require('./routes/send_token')(app);

// -------------------------------------- NFTC  -------------------------------------------------------
require('./routes/nftc-vending')(app);
require('./routes/nftc_mint')(app);


// -------------------------------------- Coin Flip  -------------------------------------------------------
// require('./routes/coinflip')(app);

// -------------------------------------- Sport Alpha Coin Flip  -------------------------------------------------------
require('./routes/sports_alpha_coinflip')(app);

// -------------------------------------- Wallet Notes  -------------------------------------------------------
require('./routes/walletnotes')(app);

// -------------------------------------- CTC  -------------------------------------------------------
require('./routes/ctc_mint')(app);

// -------------------------------------- NFT Moment  -------------------------------------------------------
require('./routes/nft_moment')(app);

// -------------------------------------- Monokeros Defi Pass -------------------------------------------------------
// require('./routes/monokeros_defi_pass')(app);


// -------------------------------------- Wenmint -------------------------------------------------------
require('./routes/wenmint')(app);

// -------------------------------------- DDoS -------------------------------------------------------
require('./routes/ddos_staking')(app);


// -------------------------------------- Engage platform -------------------------------------------------------
require('./routes/engage_platform')(app);

// -------------------------------------- Gov3 -------------------------------------------------------
require('./routes/gov3')(app);
// -------------------------------------- neuralprint -------------------------------------------------------
require('./routes/neuralprint')(app);

// ---------------------------------------------------------------------------------------------
app.listen( process.env.PORT || 8787, () => {
  console.log(`alive on ${process.env.PORT || 8787}`)
});