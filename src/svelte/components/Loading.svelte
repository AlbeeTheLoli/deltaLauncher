<span class="loading"><p>.</p><p>.</p><p>.</p></span>
<style>
    .loading{
        width: min-content;
        font-size: inherit;
        font-weight: inherit;
        opacity: 1;
        display: inline;
        color: inherit;
    }

    .loading * {
        display: inline;
    }

    .loading *:nth-child(1) {
        opacity: .25;
        animation: pulse 1.5s 0s ease-in-out infinite;
    }

    .loading *:nth-child(2) {
        animation: pulse 1.5s .5s ease-in-out infinite;
    }

    .loading *:nth-child(3) {
        animation: pulse 1.5s 1s ease-in-out infinite;
    }
</style>