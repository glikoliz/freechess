async function loadSprite(filename) {
    return new Promise(res => {
        let image = new Image();
        image.src = "/static/media/" + filename;

        image.addEventListener("load", () => {
            res(image);
        });
    });
}

// Load Piece Assets
const pieceIds = {
    "white_pawn": "P",
    "white_knight": "N",
    "white_bishop": "B",
    "white_rook": "R",
    "white_queen": "Q",
    "white_king": "K",
    "black_pawn": "p",
    "black_knight": "n",
    "black_bishop": "b",
    "black_rook": "r",
    "black_queen": "q",
    "black_king": "k"
};

let pieceImages = {};
let pieceLoaders = [];

for (let [pieceId, pieceFenCharacter] of Object.entries(pieceIds)) {
    let pieceLoader = loadSprite(pieceId + ".svg");

    pieceLoader.then(image => {
        pieceImages[pieceFenCharacter] = image;
    });

    pieceLoaders.push(pieceLoader);
}

Promise.all(pieceLoaders).then(() => {
    drawBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
});

// Load classification icon assets
const classificationIcons = {
    "brilliant": null,
    "great": null,
    "best": null,
    "excellent": null,
    "good": null,
    "inaccuracy": null,
    "mistake": null,
    "blunder": null,
    "forced": null,
    "book": null
};

for (let classification in classificationIcons) {
    loadSprite(classification + ".png").then(image => {
        classificationIcons[classification] = image;
    });
}