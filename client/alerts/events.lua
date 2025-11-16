RegisterNetEvent("EmergencyAlerts:Client:UpdateMembers", function(data)
	local fuckfest = {}
	for k,v in pairs(data) do
		if v ~= nil then
			table.insert(fuckfest, v)
		end
	end
	SendNUIMessage({
		type = "UPDATE_MEMBERS",
		data = {
			members = fuckfest
		},
	})
end)

RegisterNetEvent("EmergencyAlerts:Client:UpdateUnits", function(data)
	SendNUIMessage({
		type = "UPDATE_UNITS",
		data = {
			units = data
		},
	})
end)

RegisterNetEvent("EmergencyAlerts:Client:UpdateAlertAssignments", function(data)
	-- data is the alertAssignments table
	SendNUIMessage({
		type = "UPDATE_ALERT_ASSIGNMENTS",
		data = {
			assignments = data
		}
	})
end)