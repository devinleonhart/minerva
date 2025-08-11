<template>
  <div class="app">
    <header class="app-header">
      <h1>Minerva</h1>
      <nav class="app-nav">
        <router-link to="/" class="nav-link">Recipes</router-link>
        <router-link to="/ingredients" class="nav-link">Ingredients</router-link>
        <router-link to="/inventory" class="nav-link">Inventory</router-link>
        <router-link to="/items" class="nav-link">Items</router-link>
        <router-link to="/import" class="nav-link">Quick Import</router-link>
      </nav>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.app-header h1 {
  margin: 0 0 1rem 0;
  color: #333;
}

.app-nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f8f9fa;
  color: #333;
}

.nav-link.router-link-active {
  background: #007bff;
  color: white;
}

.app-main {
  padding: 0 2rem 2rem;
}
</style>
