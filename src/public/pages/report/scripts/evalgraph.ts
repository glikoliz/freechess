const evaluationGraphContainer = $("#evalgraph-container");
const evaluationGraphCtx = ($("#evaluation-graph").get(0)! as HTMLCanvasElement).getContext("2d")!;
let hoverIndex: number | null = null;
let topLines: (EngineLine | undefined)[] = [];
let isNewGame = false;
let mouseX = 0;
let mouseY = 0;
let cursorImg: HTMLImageElement | null = null;

async function drawEvaluationGraph() {
    const graphHeight = 80;
    const desiredGraphWidth = 350;
    const maxEval = 700; // Looks good with maxEval 500-700
    const cpPerPixel = maxEval / (graphHeight / 2);
    let positions = reportResults?.positions!;
    let baseBarWidth = Math.floor(desiredGraphWidth / positions.length);
    let remainderPixels = desiredGraphWidth - (baseBarWidth * positions.length);
    let extraWidthPerBar = remainderPixels / positions.length;
    let graphCanvas = document.getElementById('evaluation-graph') as HTMLCanvasElement;
    graphCanvas.width = desiredGraphWidth;
    graphCanvas.height = graphHeight;

    topLines = positions.map(position => position?.topLines?.find(line => line.id == 1));

    let cumulativeWidth = 0;
    let points: { x: number, y: number }[] = [];



    for (let i = 0; i < topLines.length; i++) {
        let topLine = topLines[i];
        let evaluation = topLine?.evaluation;
        let currentBarWidth = baseBarWidth + Math.floor((i + 1) * extraWidthPerBar) - Math.floor(i * extraWidthPerBar);

        let pointX = cumulativeWidth + currentBarWidth / 2;
        let pointY = graphHeight / 2;

        if (evaluation?.type === "cp") {
            pointY = graphHeight / 2 - evaluation.value / cpPerPixel;
        } else if (evaluation?.type === "mate") {
            console.log(evaluation)
            pointY = evaluation.value > 0 ? 0 : graphHeight;
            if (evaluation.value == 0) {
                pointY = points[i - 1].y;
            }
        }

        points.push({ x: pointX, y: pointY });

        cumulativeWidth += currentBarWidth;
    }

    // Draw the filled area below the points
    evaluationGraphCtx.beginPath();
    evaluationGraphCtx.moveTo(points[0].x, graphHeight);
    points.forEach(point => {
        evaluationGraphCtx.lineTo(point.x, point.y);
    });
    evaluationGraphCtx.lineTo(points[points.length - 1].x, graphHeight);
    evaluationGraphCtx.closePath();
    evaluationGraphCtx.fillStyle = "#ffffff";
    evaluationGraphCtx.fill();

    // Draws points of key moments in the game
    cumulativeWidth = 0;
    for (let i = 1; i < topLines.length; i++) {
        let topLine = topLines[i];
        let evaluation = topLine?.evaluation;
        let currentBarWidth = baseBarWidth + Math.floor((i + 1) * extraWidthPerBar) - Math.floor(i * extraWidthPerBar);
        let classification = positions[i]?.classification;
        let classificationColour = classification ? classificationColours[classification] : "#000000";

        let prev_move = topLines[i - 1]?.evaluation.value ?? 0;
        let curr_move = evaluation?.value ?? 0;

        if (evaluation?.type === "cp") {
            if (
                (classification === "great" || classification === "brilliant" || classification === "blunder") ||
                (
                    (Math.abs(prev_move - curr_move) >= 0.5) &&
                    (prev_move != curr_move) &&
                    ((prev_move >= 0 && curr_move <= 0) || (prev_move <= 0 && curr_move >= 0)) ||
                    ((prev_move === 0 && curr_move != 0) || (prev_move != 0 && curr_move === 0))
                )
            ) {
                let pointY = points[i].y
                let pointX = points[i].x

                evaluationGraphCtx.fillStyle = classificationColour;
                evaluationGraphCtx.beginPath();
                evaluationGraphCtx.arc(pointX, pointY, 4, 0, 2 * Math.PI); // Draw a circle with radius 4
                evaluationGraphCtx.fill();
            }
        }
        if (i === currentMoveIndex || i === hoverIndex) {
            let highlightColor = getSemiTransparentColor(classificationColour, 0.5);
            let highlightX = points[i].x;
            evaluationGraphCtx.fillStyle = highlightColor;
            evaluationGraphCtx.fillRect(highlightX - currentBarWidth / 2, 0, currentBarWidth, graphHeight);
        }
        cumulativeWidth += currentBarWidth;
    }


    // Draw the midline
    evaluationGraphCtx.beginPath();
    evaluationGraphCtx.moveTo(0, graphHeight / 2);
    evaluationGraphCtx.lineTo(desiredGraphWidth, graphHeight / 2);
    evaluationGraphCtx.lineWidth = 1;
    evaluationGraphCtx.strokeStyle = '#666360';
    evaluationGraphCtx.stroke();

    // Draw classification icon for hovered move
    cumulativeWidth = 0;
    for (let i = 0; i < topLines.length; i++) {
        let currentBarWidth = baseBarWidth + Math.floor((i + 1) * extraWidthPerBar) - Math.floor(i * extraWidthPerBar);

        if (i === hoverIndex) {
            const classification = positions[i]?.classification;
            if (classification && classificationIcons[classification]) {
                const icon = classificationIcons[classification];
                const iconSize = 15;
                let iconX = mouseX < iconSize ? mouseX : mouseX - iconSize - 2;
                let iconY = mouseY < iconSize / 2 ? 0 : mouseY - iconSize / 2;
                iconY = mouseY > graphHeight - iconSize / 2 ? graphHeight - iconSize : iconY;

                if (icon) {
                    const canvasWidth = evaluationGraphCtx.canvas.width;
                    const canvasHeight = evaluationGraphCtx.canvas.height;
                    let speechBubble: any = new (window as any).SpeechBubble(evaluationGraphCtx);
                    speechBubble.text = "  "
                    if (hoverIndex % 2 === 0) {
                        speechBubble.text += blackPlayer.username;
                    }
                    else {
                        speechBubble.text += whitePlayer.username;
                    }
                    speechBubble.setTargetPos(mouseX, mouseY);
                    const bubbleWidth = Math.max(blackPlayer.username.length, whitePlayer.username.length) * 12;
                    const bubbleHeight = 10;
                    let bubbleLeft = mouseX + 5;
                    let bubbleTop = mouseY + 5;
                    let bubblePadding = 7;
                    let bubbleGapX = 3;
                    let bubbleGapY = 5;
                    let totalHeight = mouseY + bubbleHeight + bubbleGapY + bubblePadding * 2;
                    let totalWidth = mouseX + bubbleWidth + bubbleGapX + bubblePadding * 2;

                    if (totalHeight > canvasHeight && totalWidth > canvasWidth) {
                        bubbleTop = mouseY - bubbleHeight - bubblePadding * 2;
                        bubbleLeft = mouseX - bubbleWidth - bubblePadding;
                    }
                    else {
                        if (totalHeight > canvasHeight) {
                            bubbleTop -= totalHeight - canvasHeight;
                        } else {
                            bubbleTop = mouseY + bubblePadding;
                        }

                        if (totalWidth > canvasWidth) {
                            bubbleLeft -= totalWidth - canvasWidth;
                        } else {
                            bubbleLeft = mouseX + bubblePadding;
                        }
                    }


                    if (bubbleLeft < 0) {
                        bubbleLeft = 0;
                    } else if (bubbleLeft + bubbleWidth > canvasWidth) {
                        bubbleLeft = canvasWidth - bubbleWidth;
                    }

                    if (bubbleTop < 0) {
                        bubbleTop = 0;
                    } else if (bubbleTop + bubbleHeight > canvasHeight) {
                        bubbleTop = canvasHeight - bubbleHeight;
                    }

                    speechBubble.panelBounds = new (window as any).SpeechBubble.Bounds(bubbleTop, bubbleLeft, bubbleWidth, bubbleHeight);

                    speechBubble.fontSize = 12;
                    speechBubble.padding = 2;
                    speechBubble.cornerRadius = 2;
                    speechBubble.panelBorderWidth = 1;
                    speechBubble.panelBorderColor = "#000";
                    speechBubble.fontColor = "#000";
                    speechBubble.padding = bubblePadding;
                    speechBubble.font = "JetBrains Mono";
                    speechBubble.panelFillColor = "rgba(255,255,255,0.7)";
                    speechBubble.tailStyle = (window as any).SpeechBubble.TAIL_STRAIGHT;

                    speechBubble.draw();

                    const imgX = bubbleLeft + bubbleGapX;
                    const imgY = bubbleTop + bubbleGapY;

                    evaluationGraphCtx.drawImage(icon, imgX, imgY, iconSize, iconSize);
                }
            }
        }
        cumulativeWidth += currentBarWidth;
    }

    // Add listeners only on new game load, for performance.
    if (isNewGame) {
        graphCanvas.addEventListener('click', (event: MouseEvent) => {
            const rect = graphCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            let clickedMoveIndex = null;

            for (let i = 0; i < points.length; i++) {
                if (points[i].x && Math.abs(points[i].x - x) < baseBarWidth / 2) {
                    clickedMoveIndex = i;
                    break;
                }
            }

            if (clickedMoveIndex !== null) {
                traverseMoves(clickedMoveIndex - currentMoveIndex);
            }
        });


        graphCanvas.addEventListener('mousemove', (event: MouseEvent) => {
            const rect = graphCanvas.getBoundingClientRect();
            mouseX = event.clientX - rect.left;
            mouseY = event.clientY - rect.top;
            let cumulativeWidth = 0;
            let newHoverIndex = null;

            for (let i = 0; i < positions.length; i++) {
                let currentBarWidth = baseBarWidth + Math.floor((i + 1) * extraWidthPerBar) - Math.floor(i * extraWidthPerBar);
                if (mouseX < cumulativeWidth + currentBarWidth) {
                    newHoverIndex = i;
                    break;
                }
                cumulativeWidth += currentBarWidth;
            }

            hoverIndex = newHoverIndex;

            drawEvaluationGraph(); //Redraws everything on every mouse move(even if you move it only by a pixel), probably not very good
            drawCursor();
        });

        graphCanvas.addEventListener('mouseout', () => {
            drawEvaluationGraph();
            hoverIndex = null;
        });

        isNewGame = false;
    }
}

function drawCursor() {
    loadSprite("crosshair.png").then(image => {
        cursorImg = image
    });

    let cursorSize = 10;

    if (cursorImg) {
        evaluationGraphCtx.drawImage(cursorImg, mouseX - cursorSize / 2, mouseY - cursorSize / 2, cursorSize, cursorSize);
    }


}

function getMovedPlayerByPosition(fen: string) {
    return fen.includes(" b ") ? "white" : "black";
}

function getMovedPieceByPosition(san: string): string | null {
    let prospectivePiece = san.charAt(0);
    let pieceColour = getMovedPlayerByPosition(san);

    if (prospectivePiece >= 'a' && prospectivePiece <= 'h') {
        const matches = san.match(/[a-h]\d.*[a-h]\d/);
        if (matches) {
            return null;
        }
        return pieceColour === 'white' ? 'P' : 'p';
    }
    prospectivePiece = prospectivePiece.toLowerCase();
    if (prospectivePiece === 'o') {
        return pieceColour === 'white' ? 'K' : 'k';
    }

    return pieceColour === 'white' ? prospectivePiece.toUpperCase() : prospectivePiece.toLowerCase();
}

function getSemiTransparentColor(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}