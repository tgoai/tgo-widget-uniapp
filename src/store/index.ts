import { createPinia } from 'pinia'
import { createUnistorage } from 'pinia-plugin-unistorage'

const store = createPinia()
store.use(createUnistorage())

export default store
