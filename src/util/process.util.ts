export default class ProcessUtil {
    public static delay(timeout: number = 1000): Promise<any> {
        return new Promise((resolve: any) => setTimeout(resolve, timeout));
    }
}
