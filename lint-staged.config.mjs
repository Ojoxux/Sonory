/**
 * lint-staged v16対応設定
 *
 * v16ではコマンドがシェルなしで実行されるため、
 * `cd dir && cmd` パターンは使用不可。
 * 関数ベース設定で各ワークスペースのCWDを指定。
 *
 * biomeの`extends`パスは設定ファイルからの相対パスで解決されるため、
 * biomeのCWDをワークスペースディレクトリに合わせる必要がある。
 */

/**
 * ワークスペース用のlint-stagedコマンド生成
 * @param {string} workspace - ワークスペースのパス（例: "apps/web"）
 * @param {boolean} withTsc - tsc --noEmitを実行するかどうか
 */
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
