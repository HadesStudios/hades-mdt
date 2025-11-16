_mdtOpen = false
_openCd = false -- Prevents spamm open/close
_settings = {}
_perms = {}
_loggedIn = false
_mdtLoggedIn = false

local _bodycam = false

AddEventHandler("MDT:Shared:DependencyUpdate", RetrieveComponents)
function RetrieveComponents()
	Callbacks = exports["hades-base"]:FetchComponent("Callbacks")
	Logger = exports["hades-base"]:FetchComponent("Logger")
	Notification = exports["hades-base"]:FetchComponent("Notification")
	UISounds = exports["hades-base"]:FetchComponent("UISounds")
	Sounds = exports["hades-base"]:FetchComponent("Sounds")
	Keybinds = exports["hades-base"]:FetchComponent("Keybinds")
	MDT = exports["hades-base"]:FetchComponent("MDT")
	Player = exports["hades-base"]:FetchComponent("Player")
	Animations = exports["hades-base"]:FetchComponent("Animations")
	EmergencyAlerts = exports["hades-base"]:FetchComponent("EmergencyAlerts")
	Weapons = exports["hades-base"]:FetchComponent("Weapons")
	Properties = exports["hades-base"]:FetchComponent("Properties")
	Admin = exports["hades-base"]:FetchComponent("Admin")
	Input = exports["hades-base"]:FetchComponent("Input")
end

RegisterNetEvent("MDT:Client:CharUpdate", function(char)
	SendNUIMessage({
		type = "SET_USER",
		data = {
			user = char,
		},
	})
end)

AddEventHandler("Core:Shared:Ready", function()
	exports["hades-base"]:RequestDependencies("MDT", {
		"Callbacks",
		"Logger",
		"Notification",
		"UISounds",
		"Sounds",
		"Keybinds",
		"Player",
		"Animations",
		"EmergencyAlerts",
		"Weapons",
		"Input",
		"Admin",
		"Properties",
	}, function(error)
		if #error > 0 then
			return
		end -- Do something to handle if not all dependencies loaded
		RetrieveComponents()

		Keybinds:Add("gov_mdt", "", "keyboard", "Gov - Open MDT", function()
			ToggleMDT()
		end)

		RegisterBadgeCallbacks()
	end)
end)

AddEventHandler("Characters:Client:Spawn", function()
	_loggedIn = true
	_mdtLoggedIn = false
end)

local usefulData = {
	Callsign = true,
	Qualifications = true,
	MDTSystemAdmin = true,
}

AddEventHandler("Characters:Client:Updated", function(key)
	if key == -1 or usefulData[key] then
		if not LocalPlayer.state.Character then
			return
		end

		local char = LocalPlayer.state.Character:GetData()
		SendNUIMessage({
			type = "SET_USER",
			data = {
				user = char,
			},
		})
	end
end)

RegisterNetEvent("MDT:Client:Login", function(points, job, jobPermissions, attorney)
	_mdtLoggedIn = true
	SendNUIMessage({
		type = "JOB_LOGIN",
		data = {
			points = points,
			job = job,
			jobPermissions = jobPermissions,
			attorney = attorney,
		},
	})
end)

RegisterNetEvent("MDT:Client:Logout", function()
	_mdtLoggedIn = false
	SendNUIMessage({
		type = "JOB_LOGOUT",
		data = nil,
	})
end)

RegisterNetEvent("MDT:Client:UpdateJobData", function(job, jobPermissions)
	SendNUIMessage({
		type = "JOB_UPDATE",
		data = {
			job = job,
			jobPermissions = jobPermissions,
		},
	})
end)

RegisterNetEvent("Characters:Client:Logout", function()
	MDT:Close()
	MDT.Badges:Close()
	EmergencyAlerts:Close()

	SendNUIMessage({
		type = "LOGOUT",
		data = nil,
	})
	SendNUIMessage({
		type = "SET_BODYCAM",
		data = {
			state = false,
		},
	})

	_bodycam = false
	_mdtLoggedIn = false
	_loggedIn = false
end)

RegisterNetEvent("UI:Client:Reset", function(manual)
	MDT:Close()
	MDT.Badges:Close()
	EmergencyAlerts:Close()
	SendNUIMessage({
		type = "SET_BODYCAM",
		data = {
			state = _bodycam,
		},
	})

	if _bodycam and manual then
		Sounds.Play:Distance(15, "bodycam.ogg", 0.1)
	end
end)

AddEventHandler("MDT:Client:ToggleBodyCam", function()
	SendNUIMessage({
		type = "TOGGLE_BODYCAM",
		data = nil,
	})

	_bodycam = not _bodycam
	if _bodycam then
		Sounds.Play:Distance(15, "bodycam.ogg", 0.05)
	end
end)

function ToggleMDT()
	if not _openCd and _mdtLoggedIn then
		if not _mdtOpen then
			_openCd = true
			MDT:Open()

			CreateThread(function()
				Wait(2000)
				_openCd = false
			end)
		else
			MDT:Close()
		end
	end
end

AddEventHandler("Government:Client:AccessPublicRecords", function()
	Wait(250)
	TriggerServerEvent("MDT:Server:OpenPublicRecords")
end)
