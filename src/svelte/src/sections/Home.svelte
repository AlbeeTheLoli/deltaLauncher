<script lang="ts">
    import { global } from '../global';
</script>

<section>
    <h1>Добро пожаловать, {$global.authInterface.logged_user.login}</h1>
</section>

<style>
    section {
        padding: 24px 32px;
        color: var(--app-text);
    }
</style>