function workspaceCommands(workspace, withTsc = true) {
	return (filenames) => {
		const files = filenames.join(" ")
		const commands = [
			`bash -c "cd ${workspace} && npx biome check --fix --unsafe ${files}"`,
		]
		if (withTsc) {
			commands.push(
				`bash -c "cd ${workspace} && npx tsc --noEmit"`,
			)
		}
		return commands
	}
}

export default {
	"apps/web/**/*.{js,jsx,ts,tsx}": workspaceCommands("apps/web"),
	"apps/api/**/*.{js,jsx,ts,tsx}": workspaceCommands("apps/api"),
	"packages/shared-types/**/*.{js,jsx,ts,tsx}": workspaceCommands("packages/shared-types"),
	"packages/utils/**/*.{js,jsx,ts,tsx}": workspaceCommands("packages/utils"),
	"packages/python-types/**/*.{js,jsx,ts,tsx}": workspaceCommands("packages/python-types"),
	"packages/config/**/*.{js,jsx,ts,tsx}": workspaceCommands("packages/config", false),
}
