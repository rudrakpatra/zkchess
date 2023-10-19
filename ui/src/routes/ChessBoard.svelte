<script>
    import {imageSrcs,names} from "$lib/assets/chesspieces";
    let state = [['bR','bN','bB','bQ','bK','bB','bN','bR'],
                ['bP','bP','bP','bP','bP','bP','bP','bP'],
                [null,null,null,null,null,null,null,null],
                [null,null,null,null,null,null,null,null],
                [null,null,null,null,null,null,null,null],
                [null,null,null,null,null,null,null,null],
                ['wP','wP','wP','wP','wP','wP','wP','wP'],
                ['wR','wN','wB','wQ','wK','wB','wN','wR']];
    export let moveHistory = [];
    
    let WB = (i,j) => (i+j)%2==0 ? "#ccc" : "#666";
    let notation=(i,j)=> String.fromCharCode(97+j)+(8-i);

    let dragData={};
</script>
<div style="display:flex;gap:1rem">
    <div id="board" style="width:400px;">
        {#each state as row,i}
            {#each row as cell,j}
            <!-- svelte-ignore a11y-unknown-aria-attribute -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
            on:drop|preventDefault={(e)=>{
                if(cell && dragData.cell[0]==cell[0])return;
                state[dragData.i][dragData.j]=null
                state[i][j]=dragData.cell;
                state=state;
                moveHistory.push(dragData.cell+notation(i,j));
                moveHistory=moveHistory;
            }} 
            on:dragover|preventDefault
            style="width:50px; height:50px; background-color:{WB(i,j)};user-select:none;position:relative;">
                <img 
                src={imageSrcs[cell]||""} 
                alt={names[cell]||""}  
                draggable={cell} 
                on:dragstart={(e)=>{
                    e.target.style.opacity=0;
                    dragData.i=i;
                    dragData.j=j;
                    dragData.cell=cell;
                }}
                on:dragend={(e)=>{
                    e.target.style.opacity=1;
                }}
                />
                <span class="position">{notation(i,j)}</span>
            </div>
            {/each}
        {/each}
    </div>
    <div id="moves" style="width:400px;">
        <div>Moves</div>
        <div class="list">{#each moveHistory as move}{move+" "}{/each}</div>
    </div>
</div>

<style>
    #board{
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
        cursor: default;
    }
    .position{
        position: absolute;
        top: .1rem;
        left: .1rem;
        font-size:0.75em;
        color: #0008;
        pointer-events: none;
    }
    img{
        width:100%;
        height:100%;
        cursor: grab;
    }
    img[src=""]{
        display: none;
        cursor: default;
    }
    #moves{
        display: flex;
        flex-direction: column;
    }
    #moves>.list{
        font-family: monospace;
        flex:1;
        background-color: #ccc;
        padding:.5rem;
        border-radius: .25rem;
    }
</style>

