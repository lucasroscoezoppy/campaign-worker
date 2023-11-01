export class TimeUtil {
    public static now(): string {
        return new Date().toISOString().split('T')[1];
    }
}
