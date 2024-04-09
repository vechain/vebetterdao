export default function* uniqueRandom(minimum: number, maximum: number): Generator<number> {
	const length = maximum - minimum + 1;
	const values = Array.from({ length }, (_, index) => index + minimum);
	while (values.length > 0) {
		const randomIndex = Math.floor(Math.random() * values.length);
		const value = values[randomIndex];
		delete values[randomIndex];
		yield value;
	}
}