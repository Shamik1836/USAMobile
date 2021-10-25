import { useApi } from '../service/api';


export function getDataByCoinID() {
    return async (id) => {
        const api = useApi();
        const result = await api.getCoinData(id);
        console.log('++ result', result)
        return result;
    }
}