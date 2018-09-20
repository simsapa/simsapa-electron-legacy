module View.TopNav exposing (Model, Msg(..), update, view)

import Bulma.Components exposing (..)
import Bulma.Elements exposing (..)
import Bulma.Form exposing (..)
import Bulma.Modifiers exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick)
import Route exposing (Route)


view : (Msg m -> m) -> Model -> Html m
view lift model =
    navbar navbarModifiers
        []
        [ navbarBrand []
            (navbarBurger False
                []
                [ span [] []
                , span [] []
                , span [] []
                ]
            )
            [ navbarItem False
                []
                [ img [ src "/assets/images/simsapa-logo-horizontal-h70.png" ] [] ]
            ]
        , navbarMenu False
            []
            [ navbarStart []
                [ menuItem "Texts" "mdi-book-open" Route.SearchTexts lift model
                , menuItem "Dictionary" "mdi-notebook" Route.SearchDictionary lift model
                ]
            ]
        ]


menuItem itemText itemIcon itemRoute lift model =
    let
        isActive_ =
            isActive model itemRoute

        itemClass =
            if isActive_ then
                "is-tab is-active"

            else
                "is-tab"
    in
    navbarItemLink isActive_
        [ onClick (lift (NavigateTo itemRoute))
        , class itemClass ]
    [ icon Standard [] [ i [ class ("mdi " ++ itemIcon) ] [] ]
    , span [] [ text itemText ]
    ]


isActive : Model -> Route -> Bool
isActive model route =
    case model.activeLink of
        Just r ->
            r == route

        Nothing ->
            False


type alias Model =
    { activeLink : Maybe Route }


type Msg m
    = NoOp
    | NavigateTo Route


update : (Msg m -> m) -> Msg m -> Model -> ( Model, Cmd m )
update lift msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        NavigateTo route ->
            ( { model | activeLink = Just route }, Cmd.none )
